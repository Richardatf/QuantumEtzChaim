from pathlib import Path
import json

root = Path('.')

openqasm_ts = r'''const FINAL_FORMS: Readonly<Record<string, string>> = Object.freeze({
  ך: "כ",
  ם: "מ",
  ן: "נ",
  ף: "פ",
  ץ: "צ",
});

export type OpenQasmGate = Readonly<{
  letter: string;
  operation: string;
  label: string;
  arity: 1 | 2 | 3;
}>;

export type OpenQasmVersion = "3.0" | "3.1";

export const IVRIT_OPENQASM_PROFILE_30 = "ivritcode-openqasm-0.1" as const;
export const IVRIT_OPENQASM_PROFILE_31 = "ivritcode-openqasm-0.2" as const;
// Backward-compatible name for the normative Run Passport projection.
export const IVRIT_OPENQASM_PROFILE = IVRIT_OPENQASM_PROFILE_30;

export const IVRIT_OPENQASM_GATES: readonly OpenQasmGate[] = Object.freeze([
  { letter: "א", operation: "p(0)", label: "Identity phase", arity: 1 },
  { letter: "ב", operation: "x", label: "Pauli X", arity: 1 },
  { letter: "ג", operation: "y", label: "Pauli Y", arity: 1 },
  { letter: "ד", operation: "z", label: "Pauli Z", arity: 1 },
  { letter: "ה", operation: "h", label: "Hadamard", arity: 1 },
  { letter: "ו", operation: "s", label: "S phase", arity: 1 },
  { letter: "ז", operation: "sdg", label: "S adjoint", arity: 1 },
  { letter: "ח", operation: "t", label: "T phase", arity: 1 },
  { letter: "ט", operation: "tdg", label: "T adjoint", arity: 1 },
  { letter: "י", operation: "sx", label: "Square-root X", arity: 1 },
  { letter: "כ", operation: "rx(pi/2)", label: "X rotation", arity: 1 },
  { letter: "ל", operation: "ry(pi/2)", label: "Y rotation", arity: 1 },
  { letter: "מ", operation: "rz(pi/2)", label: "Z rotation", arity: 1 },
  { letter: "נ", operation: "p(pi/4)", label: "Phase rotation", arity: 1 },
  { letter: "ס", operation: "cx", label: "Controlled X", arity: 2 },
  { letter: "ע", operation: "cy", label: "Controlled Y", arity: 2 },
  { letter: "פ", operation: "cz", label: "Controlled Z", arity: 2 },
  { letter: "צ", operation: "cp(pi/2)", label: "Controlled phase", arity: 2 },
  {
    letter: "ק",
    operation: "crx(pi/2)",
    label: "Controlled X rotation",
    arity: 2,
  },
  {
    letter: "ר",
    operation: "cry(pi/2)",
    label: "Controlled Y rotation",
    arity: 2,
  },
  { letter: "ש", operation: "swap", label: "Swap", arity: 2 },
  { letter: "ת", operation: "ccx", label: "Toffoli", arity: 3 },
]);

const gateByLetter = new Map(
  IVRIT_OPENQASM_GATES.map((gate) => [gate.letter, gate]),
);

const targets = Object.freeze({
  "3.0": {
    header: "OPENQASM 3.0;",
    profile: IVRIT_OPENQASM_PROFILE_30,
  },
  "3.1": {
    header: "OPENQASM 3.1;",
    profile: IVRIT_OPENQASM_PROFILE_31,
  },
});

export function normalizeIvritSource(source: string): string {
  return [...source.normalize("NFD")]
    .filter((character) => !/[\u0591-\u05c7]/u.test(character))
    .map((character) => FINAL_FORMS[character] ?? character)
    .join("")
    .normalize("NFC");
}

function operands(index: number, qubitCount: number, arity: 1 | 2 | 3) {
  const available = Array.from(
    { length: arity },
    (_, offset) => `q[${(index + offset) % qubitCount}]`,
  );
  return available.join(", ");
}

export function compileIvritToOpenQasmVersion(
  source: string,
  version: OpenQasmVersion,
  qubitCount = 3,
): string {
  if (!Number.isInteger(qubitCount) || qubitCount < 3 || qubitCount > 32) {
    throw new RangeError("OpenQASM target requires 3 to 32 qubits");
  }
  const normalized = normalizeIvritSource(source);
  if (normalized.length === 0 || normalized.length > 1024) {
    throw new SyntaxError("Enter 1 to 1,024 Hebrew instructions");
  }
  const gates = [...normalized].map((letter) => {
    const gate = gateByLetter.get(letter);
    if (!gate) {
      throw new SyntaxError(`Unsupported IvritCode instruction: ${letter}`);
    }
    return gate;
  });

  const body = gates.map(
    (gate, index) =>
      `// ${gate.letter} / ${gate.label}\n${gate.operation} ${operands(index, qubitCount, gate.arity)};`,
  );
  const target = targets[version];

  return [
    target.header,
    'include "stdgates.inc";',
    "",
    `// QEC projection profile: ${target.profile}`,
    `// IvritCode source: ${normalized}`,
    `qubit[${qubitCount}] q;`,
    `bit[${qubitCount}] result;`,
    "",
    ...body,
    "",
    "result = measure q;",
  ].join("\n");
}

export function compileIvritToOpenQasm(source: string, qubitCount = 3): string {
  return compileIvritToOpenQasmVersion(source, "3.0", qubitCount);
}

export function compileIvritToOpenQasm31(source: string, qubitCount = 3): string {
  return compileIvritToOpenQasmVersion(source, "3.1", qubitCount);
}
'''
(root / 'src/openqasm.ts').write_text(openqasm_ts, encoding='utf-8')

base_profile = json.loads((root / 'specifications/ivritcode-openqasm-v0.1.json').read_text(encoding='utf-8'))
profile31 = dict(base_profile)
profile31['$schema'] = 'https://quantumetzchaim.com/schemas/ivritcode-openqasm-v0.2.schema.json'
profile31['id'] = 'ivritcode-openqasm-0.2'
profile31['status'] = 'experimental-deterministic-translation-profile'
profile31['targetLanguage'] = 'OpenQASM 3.1'
profile31['compatibilityPolicy'] = 'semantic-hold'
profile31['compatibilityBasis'] = (
    'Profile 0.2 preserves the 0.1 gate mapping, operand allocation, measurement, and stdgates.inc usage while changing the explicit language declaration to OPENQASM 3.1. This isolates version/toolchain compatibility before any semantic redesign.'
)
(root / 'specifications/ivritcode-openqasm-v0.2.json').write_text(
    json.dumps(profile31, ensure_ascii=False, indent=2) + '\n', encoding='utf-8'
)

schema31 = json.loads((root / 'specifications/schemas/ivritcode-openqasm-v0.1.schema.json').read_text(encoding='utf-8'))
schema31['$id'] = 'https://quantumetzchaim.com/schemas/ivritcode-openqasm-v0.2.schema.json'
schema31['title'] = 'IvritCode to OpenQASM 3.1 experimental projection profile 0.2'
schema31['required'].extend(['compatibilityPolicy', 'compatibilityBasis'])
schema31['properties']['$schema'] = {'const': 'https://quantumetzchaim.com/schemas/ivritcode-openqasm-v0.2.schema.json'}
schema31['properties']['id'] = {'const': 'ivritcode-openqasm-0.2'}
schema31['properties']['status'] = {'const': 'experimental-deterministic-translation-profile'}
schema31['properties']['targetLanguage'] = {'const': 'OpenQASM 3.1'}
schema31['properties']['compatibilityPolicy'] = {'const': 'semantic-hold'}
schema31['properties']['compatibilityBasis'] = {'type': 'string', 'minLength': 120}
(root / 'specifications/schemas/ivritcode-openqasm-v0.2.schema.json').write_text(
    json.dumps(schema31, ensure_ascii=False, indent=2) + '\n', encoding='utf-8'
)

fixture_dir = root / 'tests/fixtures/openqasm31'
fixture_dir.mkdir(parents=True, exist_ok=True)
for name in ('or-seed-09.qasm', 'shalom-seed-17.qasm'):
    source = (root / 'tests/fixtures/openqasm' / name).read_text(encoding='utf-8')
    source = source.replace('OPENQASM 3.0;', 'OPENQASM 3.1;', 1)
    source = source.replace('ivritcode-openqasm-0.1', 'ivritcode-openqasm-0.2', 1)
    (fixture_dir / name).write_text(source, encoding='utf-8')

openqasm_test = r'''import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  compileIvritToOpenQasm,
  compileIvritToOpenQasm31,
  IVRIT_OPENQASM_GATES,
  IVRIT_OPENQASM_PROFILE_30,
  IVRIT_OPENQASM_PROFILE_31,
  normalizeIvritSource,
} from "../src/openqasm.js";

function fixture(path: string): string {
  return readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
}

describe("IvritCode OpenQASM projection", () => {
  it("publishes one explicit mapping for every Hebrew letter", () => {
    expect(IVRIT_OPENQASM_GATES).toHaveLength(22);
    expect(IVRIT_OPENQASM_GATES.map(({ letter }) => letter).join("")).toBe(
      "אבגדהוזחטיכלמנסעפצקרשת",
    );
  });

  it("keeps both executable mappings identical to their published profiles", () => {
    for (const [name, expectedId] of [
      ["v0.1", IVRIT_OPENQASM_PROFILE_30],
      ["v0.2", IVRIT_OPENQASM_PROFILE_31],
    ] as const) {
      const profile = JSON.parse(
        fixture(`../specifications/ivritcode-openqasm-${name}.json`),
      ) as { id: string; mappings: typeof IVRIT_OPENQASM_GATES };
      expect(profile.id).toBe(expectedId);
      expect(profile.mappings).toEqual(IVRIT_OPENQASM_GATES);
    }
  });

  it("keeps profile 0.1 frozen as deterministic OpenQASM 3.0", () => {
    const qasm = compileIvritToOpenQasm("אור");
    expect(qasm).toContain("OPENQASM 3.0;");
    expect(qasm).toContain(`QEC projection profile: ${IVRIT_OPENQASM_PROFILE_30}`);
    expect(qasm).toContain('include "stdgates.inc";');
    expect(qasm).toContain("p(0) q[0];");
    expect(qasm).toContain("s q[1];");
    expect(qasm).toContain("cry(pi/2) q[2], q[0];");
    expect(qasm).toContain("result = measure q;");
    expect(compileIvritToOpenQasm("אור")).toBe(qasm);
    expect(qasm).toBe(fixture("./fixtures/openqasm/or-seed-09.qasm"));
  });

  it("emits a parallel OpenQASM 3.1 semantic-hold profile", () => {
    const q30 = compileIvritToOpenQasm("שלום");
    const q31 = compileIvritToOpenQasm31("שלום");
    expect(q31).toContain("OPENQASM 3.1;");
    expect(q31).toContain(`QEC projection profile: ${IVRIT_OPENQASM_PROFILE_31}`);
    expect(q31).toBe(fixture("./fixtures/openqasm31/shalom-seed-17.qasm"));
    expect(
      q31
        .replace("OPENQASM 3.1;", "OPENQASM 3.0;")
        .replace(IVRIT_OPENQASM_PROFILE_31, IVRIT_OPENQASM_PROFILE_30),
    ).toBe(q30);
  });

  it("normalizes final forms and removes Hebrew marks for both targets", () => {
    expect(normalizeIvritSource("שָׁלוֹם")).toBe("שלומ");
    expect(compileIvritToOpenQasm("מֶלֶךְ")).toContain("// IvritCode source: מלכ");
    expect(compileIvritToOpenQasm31("מֶלֶךְ")).toContain("// IvritCode source: מלכ");
  });

  it("fails closed on unsupported text and invalid target sizes", () => {
    expect(() => compileIvritToOpenQasm("light")).toThrow(SyntaxError);
    expect(() => compileIvritToOpenQasm31("light")).toThrow(SyntaxError);
    expect(() => compileIvritToOpenQasm("אור", 2)).toThrow(RangeError);
    expect(() => compileIvritToOpenQasm31("אור", 33)).toThrow(RangeError);
  });
});
'''
(root / 'tests/openqasm.test.ts').write_text(openqasm_test, encoding='utf-8')

contracts_path = root / 'tests/contracts.test.ts'
contracts = contracts_path.read_text(encoding='utf-8')
contracts = contracts.replace('publishes and compiles all thirteen contract schemas', 'publishes and compiles all fourteen contract schemas')
contracts = contracts.replace('      "ivritcode-openqasm-v0.1.schema.json",\n', '      "ivritcode-openqasm-v0.1.schema.json",\n      "ivritcode-openqasm-v0.2.schema.json",\n')
old_block = '''  it("validates the IvritCode OpenQASM translation profile", () => {\n    const ajv = new Ajv2020({ allErrors: true });\n    const schema = readJson(\n      `${schemaDirectory}/ivritcode-openqasm-v0.1.schema.json`,\n    );\n    const profile = readJson(\n      fileURLToPath(\n        new URL(\n          "../specifications/ivritcode-openqasm-v0.1.json",\n          import.meta.url,\n        ),\n      ),\n    );\n    expect(ajv.validate(schema, profile), JSON.stringify(ajv.errors)).toBe(\n      true,\n    );\n  });\n'''
new_block = '''  it("validates both IvritCode OpenQASM translation profiles", () => {\n    const ajv = new Ajv2020({ allErrors: true });\n    for (const version of ["v0.1", "v0.2"]) {\n      const schema = readJson(\n        `${schemaDirectory}/ivritcode-openqasm-${version}.schema.json`,\n      );\n      const profile = readJson(\n        fileURLToPath(\n          new URL(\n            `../specifications/ivritcode-openqasm-${version}.json`,\n            import.meta.url,\n          ),\n        ),\n      );\n      expect(ajv.validate(schema, profile), JSON.stringify(ajv.errors)).toBe(\n        true,\n      );\n    }\n  });\n'''
if old_block not in contracts:
    raise SystemExit('contracts OpenQASM block not found')
contracts = contracts.replace(old_block, new_block)
contracts_path.write_text(contracts, encoding='utf-8')

validator = r'''#!/usr/bin/env python3
"""Validate QEC's OpenQASM 3.0/3.1 compatibility matrix with external toolchains."""

from __future__ import annotations

import argparse
import hashlib
import importlib.metadata
import json
import math
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from openqasm3 import parser as reference_parser
from qiskit.quantum_info import Statevector
from qiskit_qasm3_import import parse as qiskit_parse

PROFILE = "qec-openqasm-validation-matrix-0.2"
RUST_PARSER_COMMIT = "3eac9970f37baf6d030a3a185b9421cca3cf0a59"
PROGRAMS = (
    {"id": "or-seed-09", "ivritSource": "אור", "normalizedSource": "אור", "seed": 9, "filename": "or-seed-09.qasm"},
    {"id": "shalom-seed-17", "ivritSource": "שלום", "normalizedSource": "שלומ", "seed": 17, "filename": "shalom-seed-17.qasm"},
)
TARGETS = (
    {"profile": "ivritcode-openqasm-0.1", "targetLanguage": "OpenQASM 3.0", "fixtureDir": "tests/fixtures/openqasm", "policy": "normative-frozen"},
    {"profile": "ivritcode-openqasm-0.2", "targetLanguage": "OpenQASM 3.1", "fixtureDir": "tests/fixtures/openqasm31", "policy": "experimental-semantic-hold"},
)


def version(distribution: str) -> str:
    return importlib.metadata.version(distribution)


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def run_rust_parser(rust_parser_dir: Path, fixture: Path) -> dict[str, Any]:
    completed = subprocess.run(
        ["cargo", "run", "--quiet", "--manifest-path", str(rust_parser_dir / "Cargo.toml"), "-p", "oq3_semantics", "--example", "semdemo", "--", "parse", str(fixture.resolve())],
        text=True,
        capture_output=True,
        check=False,
    )
    combined = "\n".join(part for part in (completed.stdout, completed.stderr) if part).strip()
    passed = completed.returncode == 0 and "Found no parse errors" in completed.stdout
    return {"status": "PASS" if passed else "FAIL", "exitCode": completed.returncode, "diagnostic": "Found no parse errors" if passed else combined[-4000:]}


def validate_program(root: Path, rust_parser_dir: Path, target: dict[str, Any], program: dict[str, Any]) -> dict[str, Any]:
    fixture = root / target["fixtureDir"] / program["filename"]
    source = fixture.read_text(encoding="utf-8")
    checks: dict[str, Any] = {}
    try:
        ast = reference_parser.parse(source)
        checks["referenceParser"] = {"status": "PASS", "statementCount": len(ast.statements), "diagnostic": "Parsed into the OpenQASM reference AST."}
    except Exception as exc:
        checks["referenceParser"] = {"status": "FAIL", "diagnostic": f"{type(exc).__name__}: {exc}"}
    try:
        circuit = qiskit_parse(source)
        checks["qiskitImporter"] = {
            "status": "PASS",
            "qubits": circuit.num_qubits,
            "classicalBits": circuit.num_clbits,
            "operations": {str(name): int(count) for name, count in circuit.count_ops().items()},
            "diagnostic": "Imported into a Qiskit QuantumCircuit.",
        }
        simulation_circuit = circuit.remove_final_measurements(inplace=False)
        statevector = Statevector.from_instruction(simulation_circuit)
        norm = float(sum(abs(amplitude) ** 2 for amplitude in statevector.data))
        simulation_passed = math.isclose(norm, 1.0, rel_tol=1e-12, abs_tol=1e-12)
        checks["qiskitStatevector"] = {
            "status": "PASS" if simulation_passed else "FAIL",
            "dimension": len(statevector.data),
            "probabilityNorm": norm,
            "diagnostic": "Unitary portion executed as a normalized Qiskit statevector." if simulation_passed else "Statevector probability norm was not one.",
        }
    except Exception as exc:
        diagnostic = f"{type(exc).__name__}: {exc}"
        checks.setdefault("qiskitImporter", {"status": "FAIL", "diagnostic": diagnostic})
        checks.setdefault("qiskitStatevector", {"status": "FAIL", "diagnostic": diagnostic})
    checks["rustFrontEnd"] = run_rust_parser(rust_parser_dir, fixture)
    passed = all(check["status"] == "PASS" for check in checks.values())
    return {
        "id": program["id"],
        "ivritSource": program["ivritSource"],
        "normalizedSource": program["normalizedSource"],
        "seed": program["seed"],
        "fixture": str(fixture.relative_to(root)),
        "openQasmSha256": sha256(source),
        "openQasmBytes": len(source.encode("utf-8")),
        "status": "PASS" if passed else "FAIL",
        "checks": checks,
    }


def render_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# OpenQASM 3.0 / 3.1 compatibility matrix",
        "",
        f"Profile: `{report['profile']}`",
        "",
        f"Captured: `{report['capturedAt']}`",
        "",
        f"Overall result: **{report['status']}**",
        "",
        "QEC profile 0.1 remains the frozen Run Passport projection. Profile 0.2 is an experimental OpenQASM 3.1 semantic hold: the gate mapping and operand semantics are unchanged so this matrix isolates version/toolchain behavior.",
        "",
        "## Pinned validators",
        "",
        f"- OpenQASM Python reference parser: `openqasm3 {report['validators']['openqasm3Reference']}`",
        f"- Qiskit importer: `qiskit-qasm3-import {report['validators']['qiskitQasm3Import']}` with `qiskit {report['validators']['qiskit']}`",
        f"- Qiskit Rust OpenQASM 3 front end: `Qiskit/openqasm3_parser@{report['validators']['rustFrontEndCommit']}`",
        "",
        "## Matrix",
        "",
        "| Profile | Target | Program | Seed | Reference parser | Qiskit import | Statevector | Rust front end |",
        "| --- | --- | --- | ---: | --- | --- | --- | --- |",
    ]
    for target in report["profiles"]:
        for program in target["programs"]:
            checks = program["checks"]
            lines.append(
                f"| `{target['profile']}` | {target['targetLanguage']} | `{program['ivritSource']}` | {program['seed']} | {checks['referenceParser']['status']} | {checks['qiskitImporter']['status']} | {checks['qiskitStatevector']['status']} | {checks['rustFrontEnd']['status']} |"
            )
    lines.extend([
        "",
        "## Interpretation",
        "",
        "A PASS is compatibility evidence for the exact committed fixtures and pinned validators only. It is not OpenQASM certification, endorsement, or quantum-hardware execution. A 3.1 failure does not invalidate frozen profile 0.1; it identifies a toolchain/version boundary for review.",
        "",
        "Machine-readable evidence: [`../evidence/openqasm-validation-matrix-v0.2.json`](../evidence/openqasm-validation-matrix-v0.2.json).",
        "",
    ])
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rust-parser-dir", type=Path, required=True)
    parser.add_argument("--json-output", type=Path, default=Path("evidence/openqasm-validation-matrix-v0.2.json"))
    parser.add_argument("--markdown-output", type=Path, default=Path("docs/OPENQASM_30_31_MATRIX.md"))
    parser.add_argument("--allow-failures", action="store_true")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    rust_head = subprocess.check_output(["git", "-C", str(args.rust_parser_dir), "rev-parse", "HEAD"], text=True).strip()
    if rust_head != RUST_PARSER_COMMIT:
        raise SystemExit(f"Rust parser commit mismatch: expected {RUST_PARSER_COMMIT}, got {rust_head}")
    profiles = []
    for target in TARGETS:
        programs = [validate_program(root, args.rust_parser_dir, target, program) for program in PROGRAMS]
        profiles.append({**target, "status": "PASS" if all(p["status"] == "PASS" for p in programs) else "FAIL", "programs": programs})
    overall_pass = all(profile["status"] == "PASS" for profile in profiles)
    report = {
        "profile": PROFILE,
        "capturedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "status": "PASS" if overall_pass else "FAIL",
        "scope": "canonical-cross-version-corpus",
        "validators": {
            "openqasm3Reference": version("openqasm3"),
            "qiskitQasm3Import": version("qiskit-qasm3-import"),
            "qiskit": version("qiskit"),
            "rustFrontEndRepository": "Qiskit/openqasm3_parser",
            "rustFrontEndCommit": rust_head,
        },
        "profiles": profiles,
    }
    json_output = root / args.json_output
    markdown_output = root / args.markdown_output
    json_output.parent.mkdir(parents=True, exist_ok=True)
    markdown_output.parent.mkdir(parents=True, exist_ok=True)
    json_output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    markdown_output.write_text(render_markdown(report), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if overall_pass or args.allow_failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
'''
(root / 'scripts/validate-openqasm.py').write_text(validator, encoding='utf-8')

workflow = '''name: OpenQASM compatibility validation\n\non:\n  push:\n    paths:\n      - src/openqasm.ts\n      - specifications/ivritcode-openqasm-v0.1.json\n      - specifications/ivritcode-openqasm-v0.2.json\n      - specifications/schemas/ivritcode-openqasm-v0.1.schema.json\n      - specifications/schemas/ivritcode-openqasm-v0.2.schema.json\n      - tests/openqasm.test.ts\n      - tests/fixtures/openqasm/**\n      - tests/fixtures/openqasm31/**\n      - scripts/validate-openqasm.py\n      - requirements-openqasm-validation.txt\n      - .github/workflows/openqasm-validation.yml\n  pull_request:\n    paths:\n      - src/openqasm.ts\n      - specifications/ivritcode-openqasm-v0.1.json\n      - specifications/ivritcode-openqasm-v0.2.json\n      - specifications/schemas/ivritcode-openqasm-v0.1.schema.json\n      - specifications/schemas/ivritcode-openqasm-v0.2.schema.json\n      - tests/openqasm.test.ts\n      - tests/fixtures/openqasm/**\n      - tests/fixtures/openqasm31/**\n      - scripts/validate-openqasm.py\n      - requirements-openqasm-validation.txt\n      - .github/workflows/openqasm-validation.yml\n\njobs:\n  external-validation:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v7\n      - uses: actions/setup-python@v6\n        with:\n          python-version: "3.12"\n          cache: pip\n          cache-dependency-path: requirements-openqasm-validation.txt\n      - run: python -m pip install -r requirements-openqasm-validation.txt\n      - name: Pin independent Rust front end\n        run: |\n          git clone https://github.com/Qiskit/openqasm3_parser.git /tmp/openqasm3_parser\n          git -C /tmp/openqasm3_parser checkout 3eac9970f37baf6d030a3a185b9421cca3cf0a59\n      - name: Validate OpenQASM 3.0 / 3.1 matrix\n        run: |\n          python scripts/validate-openqasm.py \\\n            --rust-parser-dir /tmp/openqasm3_parser \\\n            --json-output /tmp/openqasm-validation-matrix.json \\\n            --markdown-output /tmp/openqasm-validation-matrix.md\n'''
(root / '.github/workflows/openqasm-validation.yml').write_text(workflow, encoding='utf-8')

release_path = root / 'docs/RELEASE_READINESS.md'
release = release_path.read_text(encoding='utf-8')
release = release.replace(
    '2. the `ivritcode-openqasm-0.1` emit-only projection;',
    '2. the frozen `ivritcode-openqasm-0.1` OpenQASM 3.0 emit-only projection;'
)
release = release.replace(
    'The OpenQASM artifact is checked against the project\'s versioned mapping and\nRun Passport schema, but remains emit-only. Acceptance, transpilation, or\nexecution by a named independent OpenQASM parser, simulator, or laboratory\nbackend requires separate backend-specific evidence.',
    'The Run Passport continues to bind the frozen OpenQASM 3.0 profile 0.1. A parallel experimental profile 0.2 emits `OPENQASM 3.1;` with the same mapping and operand semantics so toolchain/version behavior can be compared without changing the normative release contract. External parser/import/statevector evidence for both profiles is recorded in `evidence/openqasm-validation-matrix-v0.2.json`. Neither result implies OpenQASM certification, endorsement, or laboratory hardware execution.'
)
release_path.write_text(release, encoding='utf-8')

collab_path = root / 'docs/OPENQASM_COLLABORATION.md'
collab = collab_path.read_text(encoding='utf-8')
collab = collab.replace(
    '**QEC projection profile:** `ivritcode-openqasm-0.1`  \n**QEC emitted language declaration:** `OPENQASM 3.0;`',
    '**Normative QEC projection:** `ivritcode-openqasm-0.1` → `OPENQASM 3.0;`  \n**Experimental companion:** `ivritcode-openqasm-0.2` → `OPENQASM 3.1;`'
)
collab = collab.replace(
    'The OpenQASM projection is intentionally described as **emit-only** today.',
    'Both OpenQASM projections are intentionally described as **emit-only**. Profile 0.1 remains frozen and normative for the current Run Passport; profile 0.2 is a semantic-hold experiment that changes the explicit OpenQASM version/profile boundary without changing the 22 gate mappings.'
)
collab = collab.replace(
    '- `specifications/ivritcode-openqasm-v0.1.json`\n- schema: `specifications/schemas/ivritcode-openqasm-v0.1.schema.json`',
    '- normative 3.0: `specifications/ivritcode-openqasm-v0.1.json`\n- experimental 3.1: `specifications/ivritcode-openqasm-v0.2.json`\n- schemas: `specifications/schemas/ivritcode-openqasm-v0.1.schema.json` and `specifications/schemas/ivritcode-openqasm-v0.2.schema.json`'
)
collab += '\n## 3.0 / 3.1 comparison\n\nThe cross-version validation record is published at `docs/OPENQASM_30_31_MATRIX.md` with machine-readable evidence in `evidence/openqasm-validation-matrix-v0.2.json`. Profile 0.2 intentionally keeps the 0.1 circuit body semantics unchanged so review can focus first on version declaration and toolchain behavior.\n'
collab_path.write_text(collab, encoding='utf-8')

index_path = root / 'index.html'
index = index_path.read_text(encoding='utf-8')
index = index.replace(
    '<span>Projection profile</span>\n            <strong>ivritcode-openqasm-0.1</strong>\n            <p>Versioned deterministic mapping with schema and tests.</p>',
    '<span>Projection profiles</span>\n            <strong>3.0 frozen / 3.1 experimental</strong>\n            <p>Profile 0.1 stays normative; profile 0.2 isolates 3.1 toolchain compatibility.</p>'
)
index = index.replace(
    '<span>Canonical validation</span>\n            <strong>External PASS</strong>',
    '<span>3.0 evidence</span>\n            <strong>External PASS</strong>'
)
index = index.replace(
    'The next frontier: independent parsers, simulators, and\n                backend-facing tools.',
    'Profiles 0.1 and 0.2 are compared with pinned parsers, import,\n                and statevector checks before backend-facing experiments.'
)
index = index.replace(
    'Today: deterministic OpenQASM emission. Next: independent parser\n                evidence. Then: simulator and backend experiments, each recorded\n                with exact versions and results.',
    'Today: externally validated canonical OpenQASM 3.0 evidence plus a\n                parallel 3.1 semantic-hold experiment. Next: broader independent\n                tools and backend experiments, each recorded with exact versions.'
)
index = index.replace(
    '<a\n                  class="button"\n                  href="specifications/ivritcode-openqasm-v0.1.json"\n                  >Profile JSON</a\n                >',
    '<a\n                  class="button"\n                  href="specifications/ivritcode-openqasm-v0.1.json"\n                  >3.0 profile</a\n                >\n                <a\n                  class="button"\n                  href="specifications/ivritcode-openqasm-v0.2.json"\n                  >3.1 experiment</a\n                >'
)
index_path.write_text(index, encoding='utf-8')
