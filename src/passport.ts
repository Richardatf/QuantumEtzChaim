import {
  createRunPassport as createCanonicalRunPassport,
  inspectRunPassport as inspectCanonicalRunPassport,
  serializeRunPassport as serializeCanonicalRunPassport,
  type QECRunPassport,
} from "@qec/spec";
import {
  HEBREW_ALPHABET,
  manifestationExport,
  runProgram,
  traceExport,
  type ProgramExecutionResult,
} from "./machine.js";
import { compileIvritToOpenQasm, IVRIT_OPENQASM_PROFILE } from "./openqasm.js";
import {
  PANEL_PROTOCOL,
  validateHostFrame,
  validatePanelFrame,
  type PanelFrame,
  type StateFrame,
} from "./panel-protocol.js";

export const RUN_PASSPORT_VERSION = "qec-run-passport-0.1" as const;
export const MACHINE_RUN_EXTENSION_VERSION =
  "qec-machine-run-extension-0.1" as const;
export const RUN_PASSPORT_STORAGE_KEY = "qec.active-run-passport";

export type AcceptanceResult = "PASS" | "FAIL" | "WAIT";

export interface RunPassportEvidence {
  readonly mode: "not-run" | "simulation" | "physical";
  readonly acknowledgements: readonly PanelFrame[];
  readonly acceptance: Readonly<Record<string, AcceptanceResult>>;
}

export interface MachineRunExtension {
  readonly profileVersion: typeof MACHINE_RUN_EXTENSION_VERSION;
  readonly trace: ReturnType<typeof traceExport>;
  readonly manifestation: ReturnType<typeof manifestationExport>;
  readonly openQasm: {
    readonly profile: typeof IVRIT_OPENQASM_PROFILE;
    readonly source: string;
  };
  readonly panel: {
    readonly protocol: typeof PANEL_PROTOCOL;
    readonly machine: "QEC-1P";
    readonly expectedPixels: 4;
    readonly expectedKeys: 4;
    readonly frames: readonly StateFrame[];
  };
  readonly evidence: RunPassportEvidence;
}

export type MachineRunPassport = QECRunPassport & {
  readonly extensions: {
    readonly qecMachine: MachineRunExtension;
  };
};

// The Console-to-machine workflow always carries the machine extension.
export type RunPassport = MachineRunPassport;

export type UnifiedRunPassport = QECRunPassport & {
  readonly extensions?: {
    readonly qecMachine?: MachineRunExtension;
  };
};

export type PassportParseResult =
  { ok: true; passport: UnifiedRunPassport } | { ok: false; error: string };

export interface PassportInspection {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

const ACCEPTANCE_KEYS = new Set([
  "map",
  "handshake",
  "states",
  "brightness",
  "watchdog",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function canonicalCore(result: ProgramExecutionResult): QECRunPassport {
  return createCanonicalRunPassport({
    source: result.program,
    seed: result.seed,
    initialState: result.initialState,
    finalState: result.finalState,
    hiddenKey: HEBREW_ALPHABET[result.seed]!,
    patternShape: result.observation.selectedProjection
      .replaceAll("-", "_")
      .toUpperCase(),
    returningLetters: result.manifestation.returningLetters,
    gates: result.gates.map((gate) => gate.id),
    trace: result.pathEvents.map((event) => ({
      letter: event.letter,
      before: event.before,
      after: event.after,
      changedRegisters: event.before.flatMap((value, index) =>
        value === event.after[index] ? [] : [index],
      ),
    })),
  });
}

export function stateFramesForRun(
  result: ProgramExecutionResult,
  traceHash: string,
): StateFrame[] {
  return result.pathEvents.map((event, index) => ({
    type: "STATE",
    sequence: index + 1,
    activePath: event.letter,
    sourceNode: event.path.source,
    destinationNode: event.path.destination,
    registers: [...event.after],
    traceHash,
    brightness: 0.08,
  }));
}

export function createRunPassport(
  result: ProgramExecutionResult,
): MachineRunPassport {
  const core = canonicalCore(result);
  return {
    ...core,
    extensions: {
      qecMachine: {
        profileVersion: MACHINE_RUN_EXTENSION_VERSION,
        trace: traceExport(result),
        manifestation: manifestationExport(result),
        openQasm: {
          profile: IVRIT_OPENQASM_PROFILE,
          source: compileIvritToOpenQasm(result.program),
        },
        panel: {
          protocol: PANEL_PROTOCOL,
          machine: "QEC-1P",
          expectedPixels: 4,
          expectedKeys: 4,
          frames: stateFramesForRun(result, core.traceHash),
        },
        evidence: {
          mode: "not-run",
          acknowledgements: [],
          acceptance: {},
        },
      },
    },
  };
}

function coreProjection(passport: QECRunPassport): QECRunPassport {
  const {
    schemaVersion,
    runId,
    engineVersion,
    pathMapVersion,
    manifestationVersion,
    seed,
    traceHash,
    source,
    sourceHash,
    initialState,
    finalState,
    hiddenKey,
    patternShape,
    returningLetters,
    gates,
    trace,
    validation,
  } = passport;
  return {
    schemaVersion,
    runId,
    engineVersion,
    pathMapVersion,
    manifestationVersion,
    seed,
    traceHash,
    source,
    sourceHash,
    initialState,
    finalState,
    hiddenKey,
    patternShape,
    returningLetters,
    gates,
    trace,
    validation,
  };
}

function inspectEvidence(value: unknown): string[] {
  if (!isRecord(value)) return ["machine-evidence-object"];
  const errors: string[] = [];
  if (!["not-run", "simulation", "physical"].includes(String(value.mode))) {
    errors.push("machine-evidence-mode");
  }
  if (!Array.isArray(value.acknowledgements)) {
    errors.push("machine-evidence-acknowledgements");
  } else {
    value.acknowledgements.forEach((frame, index) => {
      if (!validatePanelFrame(frame).ok) {
        errors.push(`machine-evidence-acknowledgement-${index}`);
      }
    });
  }
  if (!isRecord(value.acceptance)) {
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

export function inspectUnifiedRunPassport(value: unknown): PassportInspection {
  const canonical = inspectCanonicalRunPassport(value);
  const errors = [...canonical.errors];
  if (!canonical.valid || !isRecord(value)) return { valid: false, errors };

  const extensions = value.extensions;
  if (extensions === undefined) return { valid: true, errors: [] };
  if (!isRecord(extensions) || !isRecord(extensions.qecMachine)) {
    return { valid: false, errors: ["machine-extension-object"] };
  }

  const candidate = value as unknown as MachineRunPassport;
  let expected: MachineRunPassport;
  try {
    expected = createRunPassport(runProgram(candidate.source, candidate.seed));
  } catch {
    return { valid: false, errors: ["machine-extension-source"] };
  }

  if (
    JSON.stringify(coreProjection(candidate)) !==
    JSON.stringify(coreProjection(expected))
  ) {
    errors.push("machine-core-divergence");
  }

  const machine = candidate.extensions.qecMachine;
  const expectedMachine = expected.extensions.qecMachine;
  if (machine.profileVersion !== MACHINE_RUN_EXTENSION_VERSION) {
    errors.push("machine-extension-version");
  }
  if (JSON.stringify(machine.trace) !== JSON.stringify(expectedMachine.trace)) {
    errors.push("machine-trace-divergence");
  }
  if (
    JSON.stringify(machine.manifestation) !==
    JSON.stringify(expectedMachine.manifestation)
  ) {
    errors.push("machine-manifestation-divergence");
  }
  if (
    JSON.stringify(machine.openQasm) !==
    JSON.stringify(expectedMachine.openQasm)
  ) {
    errors.push("machine-openqasm-divergence");
  }
  if (
    !isRecord(machine.panel) ||
    machine.panel.protocol !== PANEL_PROTOCOL ||
    machine.panel.machine !== "QEC-1P" ||
    machine.panel.expectedPixels !== 4 ||
    machine.panel.expectedKeys !== 4 ||
    JSON.stringify(machine.panel.frames) !==
      JSON.stringify(expectedMachine.panel.frames)
  ) {
    errors.push("machine-panel-divergence");
  } else {
    let previousSequence = 0;
    machine.panel.frames.forEach((frame, index) => {
      const validation = validateHostFrame(frame, previousSequence);
      if (!validation.ok) errors.push(`machine-panel-frame-${index}`);
      previousSequence = frame.sequence;
    });
  }
  errors.push(...inspectEvidence(machine.evidence));
  return { valid: errors.length === 0, errors };
}

export function validateRunPassport(
  value: unknown,
): value is MachineRunPassport {
  const inspection = inspectUnifiedRunPassport(value);
  return (
    inspection.valid &&
    isRecord(value) &&
    isRecord(value.extensions) &&
    isRecord(value.extensions.qecMachine)
  );
}

export function parseRunPassport(text: string): PassportParseResult {
  if (new TextEncoder().encode(text).byteLength > 5_242_880) {
    return { ok: false, error: "Passport exceeds the 5 MiB contract limit." };
  }
  try {
    const value: unknown = JSON.parse(text);
    const inspection = inspectUnifiedRunPassport(value);
    return inspection.valid
      ? { ok: true, passport: value as UnifiedRunPassport }
      : {
          ok: false,
          error: `Integrity failed: ${inspection.errors.join(", ")}.`,
        };
  } catch {
    return { ok: false, error: "Passport is not valid JSON." };
  }
}

export function addRunEvidence(
  passport: MachineRunPassport,
  evidence: RunPassportEvidence,
): MachineRunPassport {
  const candidate: MachineRunPassport = {
    ...passport,
    extensions: {
      ...passport.extensions,
      qecMachine: {
        ...passport.extensions.qecMachine,
        evidence,
      },
    },
  };
  const inspection = inspectUnifiedRunPassport(candidate);
  if (!inspection.valid) {
    throw new Error(
      `Run Passport evidence is invalid: ${inspection.errors.join(", ")}`,
    );
  }
  return candidate;
}

export function serializeRunPassport(passport: UnifiedRunPassport): string {
  const inspection = inspectUnifiedRunPassport(passport);
  if (!inspection.valid) {
    throw new Error(`Run Passport is invalid: ${inspection.errors.join(", ")}`);
  }
  return serializeCanonicalRunPassport(passport);
}
