from pathlib import Path
import json

root = Path('.')

# --- src/passport.ts ---
path = root / 'src/passport.ts'
text = path.read_text(encoding='utf-8')
old = 'import { compileIvritToOpenQasm, IVRIT_OPENQASM_PROFILE } from "./openqasm.js";\n'
new = old + 'import openQasmValidationReport from "../evidence/openqasm-validation-v0.1.json";\n'
if 'openQasmValidationReport' not in text:
    if old not in text: raise SystemExit('passport import anchor missing')
    text = text.replace(old, new, 1)

old = '''export interface RunPassportEvidence {
  readonly mode: "not-run" | "simulation" | "physical";
  readonly acknowledgements: readonly PanelFrame[];
  readonly acceptance: Readonly<Record<string, AcceptanceResult>>;
}
'''
new = '''export const OPENQASM_VALIDATION_PROFILE =
  "qec-openqasm-validation-0.1" as const;

export interface OpenQasmValidationEvidence {
  readonly profile: typeof OPENQASM_VALIDATION_PROFILE;
  readonly status: "PASS";
  readonly scope: "canonical-corpus";
  readonly targetLanguage: "OpenQASM 3.0";
  readonly evidencePath: "evidence/openqasm-validation-v0.1.json";
  readonly capturedAt: string;
  readonly programId: string;
  readonly normalizedSource: string;
  readonly seed: number;
  readonly openQasmSha256: string;
  readonly validators: Readonly<Record<string, string>>;
}

export interface RunPassportEvidence {
  readonly mode: "not-run" | "simulation" | "physical";
  readonly acknowledgements: readonly PanelFrame[];
  readonly acceptance: Readonly<Record<string, AcceptanceResult>>;
  readonly openQasmValidation?: OpenQasmValidationEvidence;
}
'''
if 'interface OpenQasmValidationEvidence' not in text:
    if old not in text: raise SystemExit('evidence interface anchor missing')
    text = text.replace(old, new, 1)

anchor = '''export function createRunPassport(
  result: ProgramExecutionResult,
): MachineRunPassport {
  const core = canonicalCore(result);
'''
replacement = '''type ValidationReport = typeof openQasmValidationReport;
type ValidationProgram = ValidationReport["programs"][number];

function canonicalOpenQasmValidation(
  result: ProgramExecutionResult,
): OpenQasmValidationEvidence | undefined {
  if (
    openQasmValidationReport.profile !== OPENQASM_VALIDATION_PROFILE ||
    openQasmValidationReport.status !== "PASS" ||
    openQasmValidationReport.scope !== "canonical-corpus" ||
    openQasmValidationReport.targetLanguage !== "OpenQASM 3.0"
  ) {
    return undefined;
  }
  const program = openQasmValidationReport.programs.find(
    (candidate: ValidationProgram) =>
      candidate.normalizedSource === result.program &&
      candidate.seed === result.seed &&
      candidate.status === "PASS",
  );
  if (!program) return undefined;
  return {
    profile: OPENQASM_VALIDATION_PROFILE,
    status: "PASS",
    scope: "canonical-corpus",
    targetLanguage: "OpenQASM 3.0",
    evidencePath: "evidence/openqasm-validation-v0.1.json",
    capturedAt: openQasmValidationReport.capturedAt,
    programId: program.id,
    normalizedSource: program.normalizedSource,
    seed: program.seed,
    openQasmSha256: program.openQasmSha256,
    validators: { ...openQasmValidationReport.validators },
  };
}

export function createRunPassport(
  result: ProgramExecutionResult,
): MachineRunPassport {
  const core = canonicalCore(result);
  const openQasmValidation = canonicalOpenQasmValidation(result);
'''
if 'function canonicalOpenQasmValidation' not in text:
    if anchor not in text: raise SystemExit('create passport anchor missing')
    text = text.replace(anchor, replacement, 1)

old = '''        evidence: {
          mode: "not-run",
          acknowledgements: [],
          acceptance: {},
        },
'''
new = '''        evidence: {
          mode: "not-run",
          acknowledgements: [],
          acceptance: {},
          ...(openQasmValidation ? { openQasmValidation } : {}),
        },
'''
if '...(openQasmValidation ? { openQasmValidation } : {})' not in text:
    if old not in text: raise SystemExit('create evidence anchor missing')
    text = text.replace(old, new, 1)

anchor = '''function inspectEvidence(value: unknown): string[] {
'''
helper = '''function inspectOpenQasmValidation(value: unknown): string[] {
  if (!isRecord(value)) return ["machine-openqasm-validation-object"];
  const program = openQasmValidationReport.programs.find(
    (candidate: ValidationProgram) =>
      candidate.id === value.programId &&
      candidate.normalizedSource === value.normalizedSource &&
      candidate.seed === value.seed,
  );
  const expected = program
    ? {
        profile: OPENQASM_VALIDATION_PROFILE,
        status: "PASS",
        scope: "canonical-corpus",
        targetLanguage: "OpenQASM 3.0",
        evidencePath: "evidence/openqasm-validation-v0.1.json",
        capturedAt: openQasmValidationReport.capturedAt,
        programId: program.id,
        normalizedSource: program.normalizedSource,
        seed: program.seed,
        openQasmSha256: program.openQasmSha256,
        validators: openQasmValidationReport.validators,
      }
    : undefined;
  return expected && JSON.stringify(value) === JSON.stringify(expected)
    ? []
    : ["machine-openqasm-validation-divergence"];
}

function inspectEvidence(value: unknown): string[] {
'''
if 'function inspectOpenQasmValidation' not in text:
    if anchor not in text: raise SystemExit('inspect evidence anchor missing')
    text = text.replace(anchor, helper, 1)

old = '''  if (!isRecord(value.acceptance)) {
    errors.push("machine-evidence-acceptance");
  } else {
    Object.entries(value.acceptance).forEach(([key, result]) => {
      if (!ACCEPTANCE_KEYS.has(key))
        errors.push(`machine-acceptance-key-${key}`);
      if (!["PASS", "FAIL", "WAIT"].includes(String(result))) {
        errors.push(`machine-acceptance-result-${key}`);
      }
    });
  }
  return errors;
}
'''
new = '''  if (!isRecord(value.acceptance)) {
    errors.push("machine-evidence-acceptance");
  } else {
    Object.entries(value.acceptance).forEach(([key, result]) => {
      if (!ACCEPTANCE_KEYS.has(key))
        errors.push(`machine-acceptance-key-${key}`);
      if (!["PASS", "FAIL", "WAIT"].includes(String(result))) {
        errors.push(`machine-acceptance-result-${key}`);
      }
    });
  }
  if (value.openQasmValidation !== undefined) {
    errors.push(...inspectOpenQasmValidation(value.openQasmValidation));
  }
  return errors;
}
'''
if 'inspectOpenQasmValidation(value.openQasmValidation)' not in text:
    if old not in text: raise SystemExit('inspect evidence body anchor missing')
    text = text.replace(old, new, 1)

old = '''        ...passport.extensions.qecMachine,
        evidence,
'''
new = '''        ...passport.extensions.qecMachine,
        evidence: {
          ...evidence,
          ...(passport.extensions.qecMachine.evidence.openQasmValidation
            ? {
                openQasmValidation:
                  passport.extensions.qecMachine.evidence.openQasmValidation,
              }
            : {}),
        },
'''
if 'passport.extensions.qecMachine.evidence.openQasmValidation' not in text:
    if old not in text: raise SystemExit('addRunEvidence anchor missing')
    text = text.replace(old, new, 1)

path.write_text(text, encoding='utf-8')

# --- JSON Schema ---
path = root / 'specifications/schemas/qec-run-passport-v0.1.schema.json'
schema = json.loads(path.read_text(encoding='utf-8'))
defs = schema['$defs']
defs['openQasmValidation'] = {
    'type': 'object',
    'required': ['profile','status','scope','targetLanguage','evidencePath','capturedAt','programId','normalizedSource','seed','openQasmSha256','validators'],
    'properties': {
        'profile': {'const': 'qec-openqasm-validation-0.1'},
        'status': {'const': 'PASS'},
        'scope': {'const': 'canonical-corpus'},
        'targetLanguage': {'const': 'OpenQASM 3.0'},
        'evidencePath': {'const': 'evidence/openqasm-validation-v0.1.json'},
        'capturedAt': {'type': 'string', 'minLength': 1},
        'programId': {'type': 'string', 'minLength': 1},
        'normalizedSource': {'type': 'string', 'minLength': 1},
        'seed': {'type': 'integer', 'minimum': 0, 'maximum': 21},
        'openQasmSha256': {'type': 'string', 'pattern': '^[0-9a-f]{64}$'},
        'validators': {
            'type': 'object',
            'required': ['openqasm3Reference','qiskitQasm3Import','qiskit','rustFrontEndRepository','rustFrontEndCommit'],
            'properties': {
                'openqasm3Reference': {'type': 'string', 'minLength': 1},
                'qiskitQasm3Import': {'type': 'string', 'minLength': 1},
                'qiskit': {'type': 'string', 'minLength': 1},
                'rustFrontEndRepository': {'const': 'Qiskit/openqasm3_parser'},
                'rustFrontEndCommit': {'type': 'string', 'pattern': '^[0-9a-f]{40}$'},
            },
            'additionalProperties': False,
        },
    },
    'additionalProperties': False,
}
evidence = defs['machineExtension']['properties']['evidence']
evidence['properties']['openQasmValidation'] = {'$ref': '#/$defs/openQasmValidation'}
path.write_text(json.dumps(schema, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# --- passport tests ---
path = root / 'tests/passport.test.ts'
text = path.read_text(encoding='utf-8')
needle = '''    expect(machine.openQasm.source).toContain("OPENQASM 3.0;");
'''
addition = '''    expect(machine.openQasm.source).toContain("OPENQASM 3.0;");
    expect(machine.evidence.openQasmValidation).toMatchObject({
      profile: "qec-openqasm-validation-0.1",
      status: "PASS",
      programId: "or-seed-09",
      normalizedSource: "אור",
      seed: 9,
      openQasmSha256:
        "e0dda19344f486191a5520968cabdc844e30bcb2cbd786d76fd17d3689fa8101",
    });
'''
if 'programId: "or-seed-09"' not in text:
    if needle not in text: raise SystemExit('passport test anchor missing')
    text = text.replace(needle, addition, 1)
needle = '''    expect(completed.extensions.qecMachine.evidence.mode).toBe("physical");
    expect(validateRunPassport(completed)).toBe(true);
'''
addition = '''    expect(completed.extensions.qecMachine.evidence.mode).toBe("physical");
    expect(
      completed.extensions.qecMachine.evidence.openQasmValidation?.programId,
    ).toBe("or-seed-09");
    expect(validateRunPassport(completed)).toBe(true);
'''
if 'openQasmValidation?.programId' not in text:
    if needle not in text: raise SystemExit('physical evidence test anchor missing')
    text = text.replace(needle, addition, 1)
path.write_text(text, encoding='utf-8')

# --- bridge test ---
path = root / 'tests/ivritcode-machine-bridge.test.ts'
text = path.read_text(encoding='utf-8')
needle = '''    expect(machine.openQasm.source).toContain("result = measure q;");
'''
addition = '''    expect(machine.openQasm.source).toContain("result = measure q;");
    expect(machine.evidence.openQasmValidation).toMatchObject({
      profile: "qec-openqasm-validation-0.1",
      status: "PASS",
      programId: "shalom-seed-17",
      normalizedSource: "שלומ",
      seed: 17,
      openQasmSha256:
        "0fbef195017714ce57f05053c73f4fc9ed916d22fa8f97d0929275a9b3355c6e",
    });
'''
if 'programId: "shalom-seed-17"' not in text:
    if needle not in text: raise SystemExit('bridge test anchor missing')
    text = text.replace(needle, addition, 1)
needle = '''    expect(roundTrip.passport.extensions?.qecMachine?.evidence.mode).toBe(
      "simulation",
    );
'''
addition = '''    expect(roundTrip.passport.extensions?.qecMachine?.evidence.mode).toBe(
      "simulation",
    );
    expect(
      roundTrip.passport.extensions?.qecMachine?.evidence.openQasmValidation
        ?.programId,
    ).toBe("shalom-seed-17");
'''
if '?.programId,\n    ).toBe("shalom-seed-17")' not in text:
    if needle not in text: raise SystemExit('bridge roundtrip anchor missing')
    text = text.replace(needle, addition, 1)
path.write_text(text, encoding='utf-8')

# --- Vite publish evidence ---
path = root / 'vite.config.ts'
text = path.read_text(encoding='utf-8')
if '"evidence"' not in text.split('] as const;',1)[0]:
    text = text.replace('  "firmware",\n] as const;', '  "firmware",\n  "evidence",\n] as const;', 1)
path.write_text(text, encoding='utf-8')

# --- release readiness ---
path = root / 'docs/RELEASE_READINESS.md'
text = path.read_text(encoding='utf-8')
old = '''The OpenQASM artifact is checked against the project's versioned mapping and
Run Passport schema, but remains emit-only. Acceptance, transpilation, or
execution by a named independent OpenQASM parser, simulator, or laboratory
backend requires separate backend-specific evidence.
'''
new = '''The OpenQASM projection remains an emit-only interoperability target rather than a
claim of quantum-hardware execution. The canonical `אור` seed 09 and `שלום`
normalized to `שלומ` seed 17 projections now carry separate external validation
evidence in `qec-openqasm-validation-0.1`: both exact QASM fixtures pass the
OpenQASM Python reference parser, Qiskit import, normalized statevector execution
(after removing final measurement), and the pinned independent Qiskit Rust
OpenQASM 3 front end. Their SHA-256 values and exact validator versions are
recorded in `evidence/openqasm-validation-v0.1.json` and are bound into those
canonical Run Passports. This evidence is intentionally corpus-scoped; it is not
OpenQASM certification, project endorsement, or hardware-backend validation.
Broader program coverage, OpenQASM 3.1 profile review, and laboratory/backend
execution remain external work.
'''
if old not in text: raise SystemExit('release readiness anchor missing')
text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')

# --- collaboration brief ---
path = root / 'docs/OPENQASM_COLLABORATION.md'
text = path.read_text(encoding='utf-8')
old = '''- **Independent parser acceptance:** evidence still being expanded.
- **Simulator execution:** evidence still being expanded.
- **Hardware-backend execution:** not implied by parser or simulator success.
'''
new = '''- **Independent parser acceptance:** PASS for the canonical `אור` seed 09 and `שלום` → `שלומ` seed 17 corpus with the OpenQASM Python reference parser and pinned independent Qiskit Rust front end.
- **Qiskit import + statevector execution:** PASS for the same canonical corpus; statevector evidence executes the unitary portion after removing final measurement.
- **Validation record:** exact tool versions, diagnostics, source SHA-256 values, and scope are captured in `evidence/openqasm-validation-v0.1.json` and summarized in `docs/OPENQASM_VALIDATION.md`.
- **Hardware-backend execution:** not implied by parser or statevector success and not yet claimed.
'''
if old not in text: raise SystemExit('collaboration evidence anchor missing')
text = text.replace(old, new, 1)
old = '''## Suggested first collaboration task

Take the canonical emitted programs for `אור` and `שלום`, parse them with at least two independently maintained OpenQASM 3 toolchains, record exact tool versions and diagnostics, and attach the results to a versioned validation record that can be referenced by the corresponding QEC Run Passport.

If those passes disagree, the disagreement is valuable evidence and should remain visible.
'''
new = '''## Suggested next collaboration task

The first validation milestone is complete for `אור` and `שלום`. The next useful task is to broaden the corpus, review whether profile 0.1 should remain frozen at OpenQASM 3.0 or gain a parallel 3.1 profile, and add another simulator or backend-facing toolchain that is independent of the current parser path.

Please try to break the existing evidence too. If tools disagree, the disagreement should remain visible rather than being averaged into a compatibility claim.
'''
if old not in text: raise SystemExit('collaboration task anchor missing')
text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')

# --- homepage pitch ---
path = root / 'index.html'
text = path.read_text(encoding='utf-8')
replacements = [
    ('<span>Current boundary</span>\n            <strong>Emit-only</strong>\n            <p>\n              No claim of official OpenQASM conformance or quantum hardware\n              execution.\n            </p>',
     '<span>Canonical validation</span>\n            <strong>External PASS</strong>\n            <p>\n              אור and שלום pass pinned parser/import/statevector checks; no\n              certification or hardware claim is implied.\n            </p>'),
    ('The next frontier: independent parsers, simulators, and\n                backend-facing tools.',
     'Canonical אור and שלום now pass external parser, Qiskit import,\n                statevector, and independent Rust front-end checks.'),
    ('Today: deterministic OpenQASM emission. Next: independent parser\n                evidence. Then: simulator and backend experiments, each recorded\n                with exact versions and results.',
     'Today: deterministic emission plus corpus-scoped external parser and\n                statevector evidence. Next: broader corpus, OpenQASM 3.1 review,\n                and backend-facing experiments with exact versions and results.'),
    ('Run canonical QEC output through recognized OpenQASM parsers. We\n                want exact tool versions, diagnostics, disagreements, and\n                reproducible failure cases recorded as evidence rather than\n                quietly patched around.',
     'The first canonical parser milestone now passes. Expand the corpus,\n                reproduce our pinned results, and bring us exact diagnostics or\n                failure cases from additional independently maintained tools.'),
    ('<span class="num">05 / RELEASE</span>\n              <h3>Current boundary</h3>\n              <p>\n                The release-readiness document explicitly identifies the\n                OpenQASM projection as emit-only.\n              </p>\n              <a href="docs/RELEASE_READINESS.md">Read release readiness →</a>',
     '<span class="num">05 / VALIDATION</span>\n              <h3>External evidence</h3>\n              <p>\n                Exact validator versions, QASM hashes, parser results, and\n                statevector evidence are captured for the canonical corpus.\n              </p>\n              <a href="docs/OPENQASM_VALIDATION.md">Read validation evidence →</a>'),
    ('A useful first contribution is small: take the emitted programs\n                for\n                <span lang="he" dir="rtl">אור</span> and\n                <span lang="he" dir="rtl">שלום</span>, run them through an\n                OpenQASM 3 parser or simulator you trust, record the exact\n                version and diagnostics, and tell us what must change. If two\n                tools disagree, preserve the disagreement. That is evidence too.',
     'The first canonical validation milestone is now reproducible and public.\n                Help us broaden it: test more IvritCode programs, review the\n                3.0-to-3.1 profile strategy, challenge the 22 mappings, or add an\n                independent simulator/backend-facing tool. Record exact versions\n                and preserve disagreements. That is evidence too.'),
    ('"VALID LOCAL PROJECTION / independent parser evidence requested"',
     '"CANONICAL CORPUS EXTERNALLY VALIDATED / broader review requested"'),
]
for old, new in replacements:
    if old not in text:
        raise SystemExit(f'index anchor missing: {old[:60]!r}')
    text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
