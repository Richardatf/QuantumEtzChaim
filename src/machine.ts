import fullPathMap from "../specifications/qec-paths-v0.3.json";

export const HEBREW_ALPHABET = [..."אבגדהוזחטיכלמנסעפצקרשת"] as const;

export type HebrewLetter = (typeof HEBREW_ALPHABET)[number];
export type SefirahName =
  | "Keter"
  | "Chokhmah"
  | "Binah"
  | "Daat"
  | "Chesed"
  | "Gevurah"
  | "Tiferet"
  | "Netzach"
  | "Hod"
  | "Yesod"
  | "Malchut";

export type ServiceName =
  | "BinahCompiler"
  | "GevurahPolicy"
  | "KeterService"
  | "TiferetScheduler"
  | "HodInterface"
  | "YesodBus"
  | "DaatObserver"
  | "MalchutOutput"
  | "ChokhmahService"
  | "ChesedAllocator"
  | "NetzachRuntime";

export interface QecPath {
  letter: HebrewLetter;
  name: string;
  source: SefirahName;
  destination: SefirahName;
  operation: "hold" | "exchange" | "reseed";
  transform: {
    id: string;
    version: "0.3.0";
  };
  services: readonly ServiceName[];
  description: string;
}

export interface CoherenceState {
  activation: number;
  phase: number;
  coherence: number;
}

export interface PathEvent {
  step: number;
  letter: HebrewLetter;
  path: QecPath;
  before: readonly number[];
  after: readonly number[];
  servicesInvoked: readonly ServiceName[];
  coherence: CoherenceState;
  coherenceChange: number;
}

export interface GateEvent {
  id: string;
  left: HebrewLetter;
  right: HebrewLetter;
  route: readonly [SefirahName, SefirahName, SefirahName, SefirahName];
  sharedNodes: readonly SefirahName[];
  sharedServices: readonly ServiceName[];
  composition: "continuation" | "crossing" | "reinforcement";
  registerChanges: number;
  coherenceDelta: number;
  technicalDescription: string;
}

export interface ObservationEvent {
  step: number;
  reason: "program-end";
  stateHash: string;
  candidates: readonly ObservationProjection[];
  selectedProjection: string;
  snapshot: readonly number[];
}

export interface ObservationProjection {
  id: "register-order" | "mirror-order" | "phase-offset";
  label: string;
  stateHash: string;
  focusLetter: HebrewLetter;
  confidence: number;
  rationale: string;
}

export interface MalchutManifestation {
  returningLetters: readonly HebrewLetter[];
  registerString: string;
  base22Registers: string;
  pathSignature: string;
  checksum: string;
  summary: string;
}

export interface ManifestationExport {
  schemaVersion: "qec-manifestation-0.2";
  program: string;
  seed: number;
  finalState: readonly number[];
  finalStateHash: string;
  paths: readonly {
    step: number;
    letter: HebrewLetter;
    source: SefirahName;
    destination: SefirahName;
    services: readonly ServiceName[];
  }[];
  gates: readonly {
    id: string;
    composition: GateEvent["composition"];
    registerChanges: number;
    coherenceDelta: number;
  }[];
  observation: {
    selectedProjection: string;
    stateHash: string;
    snapshot: readonly number[];
  };
  output: {
    registerString: string;
    base22Registers: string;
    pathSignature: string;
    checksum: string;
  };
}

export interface SeedComparison {
  baselineSeed: number;
  activeSeed: number;
  changedVisibleRegisters: number;
  activeDistinctValues: number;
  coherenceDelta: number;
  baselineObservation: string;
  activeObservation: string;
  observationChanged: boolean;
  baselineChecksum: string;
  activeChecksum: string;
  baselineFirstLetter: HebrewLetter;
  activeFirstLetter: HebrewLetter;
}

export interface TraceComparison {
  baselineProgram: string;
  activeProgram: string;
  commonPathPrefix: number;
  changedFinalRegisters: number;
  pathDelta: number;
  gateDelta: number;
  coherenceDelta: number;
  observationChanged: boolean;
  baselineObservation: string;
  activeObservation: string;
  baselineChecksum: string;
  activeChecksum: string;
}

export interface TraceDivergence {
  step: number;
  reason:
    "length" | "instruction" | "transform" | "before-state" | "after-state";
  baselineInstruction: HebrewLetter | null;
  activeInstruction: HebrewLetter | null;
  baselineRoute: string;
  activeRoute: string;
  baselineTransform: string;
  activeTransform: string;
  baselineStateHash: string;
  activeStateHash: string;
  changedRegisters: readonly number[];
}

export interface VerticalSliceResult {
  program: "אור";
  seed: number;
  initialState: readonly number[];
  finalState: readonly number[];
  pathEvents: readonly PathEvent[];
  gates: readonly GateEvent[];
  observation: ObservationEvent;
  manifestation: MalchutManifestation;
}

export interface ProgramExecutionResult {
  program: string;
  seed: number;
  initialState: readonly number[];
  finalState: readonly number[];
  pathEvents: readonly PathEvent[];
  gates: readonly GateEvent[];
  observation: ObservationEvent;
  manifestation: MalchutManifestation;
}

export const OR_PATHS: Readonly<Record<"א" | "ו" | "ר", QecPath>> = {
  א: {
    letter: "א",
    name: "Aleph / Frame",
    source: "Keter",
    destination: "Tiferet",
    operation: "hold",
    transform: { id: "preserve-frame", version: "0.3.0" },
    services: ["KeterService", "TiferetScheduler"],
    description: "Preserve the program frame and its common orientation.",
  },
  ו: {
    letter: "ו",
    name: "Vav / Exchange",
    source: "Hod",
    destination: "Yesod",
    operation: "exchange",
    transform: { id: "mirror-exchange", version: "0.3.0" },
    services: ["HodInterface", "YesodBus"],
    description:
      "Exchange mirrored register values through the integration bus.",
  },
  ר: {
    letter: "ר",
    name: "Resh / Reseed",
    source: "Yesod",
    destination: "Malchut",
    operation: "reseed",
    transform: { id: "seed-rotation", version: "0.3.0" },
    services: ["YesodBus", "MalchutOutput"],
    description: "Reseed the visible alphabet from Aleph Olam orientation.",
  },
};

interface TransformDefinition {
  operation: QecPath["operation"];
  salt: number;
}

export const TRANSFORM_REGISTRY = {
  "preserve-frame": { operation: "hold", salt: 0 },
  "impulse-pair": { operation: "exchange", salt: 1 },
  "form-pair": { operation: "exchange", salt: 2 },
  "polarity-bridge": { operation: "exchange", salt: 3 },
  "expand-pulse": { operation: "hold", salt: 4 },
  "mirror-exchange": { operation: "exchange", salt: 5 },
  "constrain-form": { operation: "hold", salt: 6 },
  "boundary-balance": { operation: "exchange", salt: 7 },
  "mercy-balance": { operation: "exchange", salt: 8 },
  "severity-balance": { operation: "exchange", salt: 9 },
  "wisdom-rotation": { operation: "reseed", salt: 10 },
  "understanding-rotation": { operation: "reseed", salt: 11 },
  "endurance-flow": { operation: "exchange", salt: 12 },
  "language-flow": { operation: "exchange", salt: 13 },
  "expansion-carry": { operation: "hold", salt: 14 },
  "constraint-carry": { operation: "hold", salt: 15 },
  "persistence-reflect": { operation: "exchange", salt: 16 },
  "iteration-bus": { operation: "exchange", salt: 17 },
  "interface-bus": { operation: "exchange", salt: 18 },
  "seed-rotation": { operation: "reseed", salt: 19 },
  "center-descent": { operation: "reseed", salt: 20 },
  "manifest-frame": { operation: "hold", salt: 21 },
} as const satisfies Readonly<Record<string, TransformDefinition>>;

export const FULL_PATHS: Readonly<Record<HebrewLetter, QecPath>> =
  Object.fromEntries(
    fullPathMap.paths.map((path) => [
      path.letter,
      {
        letter: path.letter,
        name: `${path.letterName} / ${path.transform.id}`,
        source: path.source,
        destination: path.destination,
        operation: path.operation,
        transform: path.transform,
        services: path.services,
        description: path.description,
      },
    ]),
  ) as Readonly<Record<HebrewLetter, QecPath>>;

const BASE_SERVICES = [
  "BinahCompiler",
  "GevurahPolicy",
] as const satisfies readonly ServiceName[];

const FINAL_LETTER_FORMS: Readonly<Record<string, HebrewLetter>> = {
  ך: "כ",
  ם: "מ",
  ן: "נ",
  ף: "פ",
  ץ: "צ",
};

function normalizeProgram(program: string): string {
  return [...program.normalize("NFC")]
    .map((letter) => FINAL_LETTER_FORMS[letter] ?? letter)
    .join("");
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function fnv1a(values: readonly number[]): number {
  let hash = 0x811c9dc5;
  values.forEach((value) => {
    hash ^= value;
    hash = Math.imul(hash, 0x01000193);
  });
  return hash >>> 0;
}

function stateHash(values: readonly number[]): string {
  return fnv1a(values).toString(16).padStart(8, "0");
}

function buildObservationCandidates(
  state: readonly number[],
  seed: number,
): ObservationProjection[] {
  const visible = state.slice(0, 22);
  const definitions = [
    {
      id: "register-order" as const,
      label: "Register order",
      values: visible,
      rationale: "Reads the manifested registers in machine order.",
    },
    {
      id: "mirror-order" as const,
      label: "Mirror order",
      values: [...visible].reverse(),
      rationale: "Reads the same state through its paired-register reflection.",
    },
    {
      id: "phase-offset" as const,
      label: "Aleph Olam phase",
      values: visible.map((value) => (value + seed) % 22),
      rationale:
        "Projects the state through the shared Aleph Olam orientation.",
    },
  ];

  return definitions.map((definition, index) => {
    const hash = stateHash([...definition.values, seed, index]);
    const focusIndex = parseInt(hash.slice(-2), 16) % 22;
    return {
      id: definition.id,
      label: definition.label,
      stateHash: hash,
      focusLetter: HEBREW_ALPHABET[focusIndex]!,
      confidence: Number(
        (0.5 + (parseInt(hash.slice(0, 3), 16) % 501) / 1000).toFixed(3),
      ),
      rationale: definition.rationale,
    };
  });
}

function coherenceFor(
  state: readonly number[],
  seed: number,
  step: number,
): CoherenceState {
  const hash = fnv1a([...state, seed, step]);
  const activation = clamp01(((hash >>> 8) % 1001) / 1000);
  const phase = ((hash % 6284) / 1000) % (Math.PI * 2);
  const spread = new Set(state.slice(0, 22)).size / 22;
  const coherence = clamp01(
    Number((0.42 + spread * 0.38 + activation * 0.2).toFixed(3)),
  );
  return {
    activation: Number(activation.toFixed(3)),
    phase: Number(phase.toFixed(3)),
    coherence,
  };
}

function transform(
  state: readonly number[],
  path: QecPath,
  seed: number,
): number[] {
  const visible = state.slice(0, 22);
  const hidden = state[22] ?? seed;
  const definition = (
    TRANSFORM_REGISTRY as Readonly<Record<string, TransformDefinition>>
  )[path.transform.id];
  if (!definition || definition.operation !== path.operation) {
    throw new Error(`Unknown or incompatible transform: ${path.transform.id}`);
  }
  let next: number[];

  if (path.operation === "hold") {
    next = [...visible];
  } else if (path.transform.id === "mirror-exchange") {
    next = visible.map((value, index) => {
      const mirror = visible[21 - index] ?? 0;
      return (value + mirror + seed) % 22;
    });
  } else if (path.operation === "exchange") {
    next = visible.map((_, index) => {
      const partner = visible[(21 - index + definition.salt) % 22] ?? 0;
      return (partner + seed + definition.salt) % 22;
    });
  } else if (path.transform.id === "seed-rotation") {
    next = visible.map((_, index) => (index + hidden) % 22);
  } else {
    next = visible.map((value) => (value + hidden + definition.salt) % 22);
  }

  return [...next, hidden];
}

function composeGate(left: PathEvent, right: PathEvent): GateEvent {
  const leftNodes = [left.path.source, left.path.destination];
  const rightNodes = [right.path.source, right.path.destination];
  const sharedNodes = leftNodes.filter((node) => rightNodes.includes(node));
  const continuation =
    left.path.destination === right.path.source ||
    right.path.destination === left.path.source;
  const reinforcement =
    left.path.source === right.path.source &&
    left.path.destination === right.path.destination;
  const composition = reinforcement
    ? "reinforcement"
    : continuation
      ? "continuation"
      : "crossing";
  const sharedServices = left.servicesInvoked.filter((service) =>
    right.servicesInvoked.includes(service),
  );
  const registerChanges = left.before.reduce(
    (count, value, index) => count + (value !== right.after[index] ? 1 : 0),
    0,
  );
  return {
    id: `${left.letter}־${right.letter}`,
    left: left.letter,
    right: right.letter,
    route: [
      left.path.source,
      left.path.destination,
      right.path.source,
      right.path.destination,
    ],
    sharedNodes,
    sharedServices,
    composition,
    registerChanges,
    coherenceDelta: Number(
      (right.coherence.coherence - left.coherence.coherence).toFixed(3),
    ),
    technicalDescription:
      composition === "continuation"
        ? `${left.path.destination} carries state directly into ${right.path.name}.`
        : composition === "reinforcement"
          ? "Both instructions reinforce the same architectural route."
          : "The routes cross through shared machine state without a common node.",
  };
}

function executeProgram(program: string, seed = 9): ProgramExecutionResult {
  if (!Number.isInteger(seed) || seed < 0 || seed > 21) {
    throw new RangeError("Aleph Olam seed must be a base-22 digit.");
  }
  if (program.length === 0) {
    throw new SyntaxError(
      "IvritCode program must contain at least one letter.",
    );
  }
  if ([...program].length > 1024) {
    throw new RangeError("IvritCode program exceeds the 1,024-step limit.");
  }
  const initialState = [
    ...Array.from({ length: 22 }, (_, index) => index),
    seed,
  ];
  let state = [...initialState];
  let priorCoherence = 0;

  const pathEvents = [...program].map((letter, index) => {
    const path = FULL_PATHS[letter as HebrewLetter];
    if (!path) {
      throw new SyntaxError(`Unsupported IvritCode instruction: ${letter}`);
    }
    const before = [...state];
    const after = transform(before, path, seed);
    const coherence = coherenceFor(after, seed, index + 1);
    const event: PathEvent = {
      step: index + 1,
      letter: path.letter,
      path,
      before,
      after,
      servicesInvoked: [...new Set([...BASE_SERVICES, ...path.services])],
      coherence,
      coherenceChange: Number(
        (coherence.coherence - priorCoherence).toFixed(3),
      ),
    };
    priorCoherence = coherence.coherence;
    state = after;
    return event;
  });

  const gates = pathEvents
    .slice(1)
    .map((event, index) => composeGate(pathEvents[index]!, event));
  const finalState = [...state];
  const hash = stateHash([...finalState, seed]);
  const candidates = buildObservationCandidates(finalState, seed);
  const selectedIndex =
    fnv1a([...finalState, seed, 0xdaa7]) % candidates.length;
  const observation: ObservationEvent = {
    step: pathEvents.length,
    reason: "program-end",
    stateHash: hash,
    candidates,
    selectedProjection: candidates[selectedIndex]!.id,
    snapshot: [...finalState],
  };
  const returningLetters = finalState
    .slice(0, 22)
    .map((value) => HEBREW_ALPHABET[value]!)
    .filter((letter, index, all) => all.indexOf(letter) === index);
  const manifestation: MalchutManifestation = {
    returningLetters,
    registerString: finalState
      .slice(0, 22)
      .map((value) => HEBREW_ALPHABET[value]!)
      .join(""),
    base22Registers: finalState
      .map((value) => value.toString(22).toUpperCase().padStart(2, "0"))
      .join(" "),
    pathSignature: pathEvents
      .map(
        (event) =>
          `${event.letter}:${event.path.source}>${event.path.destination}`,
      )
      .join(" | "),
    checksum: stateHash([
      ...finalState,
      ...pathEvents.map((event) =>
        Math.round(event.coherence.coherence * 1000),
      ),
    ]),
    summary: `${program} completed ${pathEvents.length} paths, formed ${gates.length} gates, and manifested observation ${hash}.`,
  };

  return {
    program,
    seed,
    initialState,
    finalState,
    pathEvents,
    gates,
    observation,
    manifestation,
  };
}

export function runProgram(program: string, seed = 9): ProgramExecutionResult {
  return executeProgram(normalizeProgram(program), seed);
}

export function runOrVerticalSlice(seed = 9): VerticalSliceResult {
  return executeProgram("אור", seed) as VerticalSliceResult;
}

export function manifestationExport(
  result: ProgramExecutionResult,
): ManifestationExport {
  return {
    schemaVersion: "qec-manifestation-0.2",
    program: result.program,
    seed: result.seed,
    finalState: [...result.finalState],
    finalStateHash: result.observation.stateHash,
    paths: result.pathEvents.map((event) => ({
      step: event.step,
      letter: event.letter,
      source: event.path.source,
      destination: event.path.destination,
      services: [...event.servicesInvoked],
    })),
    gates: result.gates.map((gate) => ({
      id: gate.id,
      composition: gate.composition,
      registerChanges: gate.registerChanges,
      coherenceDelta: gate.coherenceDelta,
    })),
    observation: {
      selectedProjection: result.observation.selectedProjection,
      stateHash: result.observation.stateHash,
      snapshot: [...result.observation.snapshot],
    },
    output: {
      registerString: result.manifestation.registerString,
      base22Registers: result.manifestation.base22Registers,
      pathSignature: result.manifestation.pathSignature,
      checksum: result.manifestation.checksum,
    },
  };
}

export function serializeManifestation(result: ProgramExecutionResult): string {
  return JSON.stringify(manifestationExport(result), null, 2);
}

export function compareOrSeeds(
  activeSeed: number,
  baselineSeed = 9,
): SeedComparison {
  return compareProgramSeeds("אור", activeSeed, baselineSeed);
}

export function compareProgramSeeds(
  program: string,
  activeSeed: number,
  baselineSeed = 9,
): SeedComparison {
  const baseline = runProgram(program, baselineSeed);
  const active = runProgram(program, activeSeed);
  const baselineCoherence =
    baseline.pathEvents.at(-1)?.coherence.coherence ?? 0;
  const activeCoherence = active.pathEvents.at(-1)?.coherence.coherence ?? 0;
  return {
    baselineSeed,
    activeSeed,
    changedVisibleRegisters: baseline.finalState
      .slice(0, 22)
      .reduce(
        (count, value, index) =>
          count + (value !== active.finalState[index] ? 1 : 0),
        0,
      ),
    activeDistinctValues: new Set(active.finalState.slice(0, 22)).size,
    coherenceDelta: Number((activeCoherence - baselineCoherence).toFixed(3)),
    baselineObservation: baseline.observation.selectedProjection,
    activeObservation: active.observation.selectedProjection,
    observationChanged:
      baseline.observation.selectedProjection !==
      active.observation.selectedProjection,
    baselineChecksum: baseline.manifestation.checksum,
    activeChecksum: active.manifestation.checksum,
    baselineFirstLetter: baseline.manifestation.returningLetters[0]!,
    activeFirstLetter: active.manifestation.returningLetters[0]!,
  };
}

export function compareProgramRuns(
  baseline: ProgramExecutionResult,
  active: ProgramExecutionResult,
): TraceComparison {
  const comparablePaths = Math.min(
    baseline.pathEvents.length,
    active.pathEvents.length,
  );
  let commonPathPrefix = 0;
  while (
    commonPathPrefix < comparablePaths &&
    baseline.pathEvents[commonPathPrefix]?.letter ===
      active.pathEvents[commonPathPrefix]?.letter &&
    baseline.pathEvents[commonPathPrefix]?.path.transform.id ===
      active.pathEvents[commonPathPrefix]?.path.transform.id
  ) {
    commonPathPrefix += 1;
  }

  const baselineCoherence =
    baseline.pathEvents.at(-1)?.coherence.coherence ?? 0;
  const activeCoherence = active.pathEvents.at(-1)?.coherence.coherence ?? 0;

  return {
    baselineProgram: baseline.program,
    activeProgram: active.program,
    commonPathPrefix,
    changedFinalRegisters: baseline.finalState.reduce(
      (count, value, index) =>
        count + (value !== active.finalState[index] ? 1 : 0),
      0,
    ),
    pathDelta: active.pathEvents.length - baseline.pathEvents.length,
    gateDelta: active.gates.length - baseline.gates.length,
    coherenceDelta: Number((activeCoherence - baselineCoherence).toFixed(3)),
    observationChanged:
      baseline.observation.selectedProjection !==
      active.observation.selectedProjection,
    baselineObservation: baseline.observation.selectedProjection,
    activeObservation: active.observation.selectedProjection,
    baselineChecksum: baseline.manifestation.checksum,
    activeChecksum: active.manifestation.checksum,
  };
}

export function findFirstTraceDivergence(
  baseline: ProgramExecutionResult,
  active: ProgramExecutionResult,
): TraceDivergence | null {
  const eventCount = Math.max(
    baseline.pathEvents.length,
    active.pathEvents.length,
  );

  for (let index = 0; index < eventCount; index += 1) {
    const baselineEvent = baseline.pathEvents[index];
    const activeEvent = active.pathEvents[index];
    let reason: TraceDivergence["reason"] | null = null;

    if (!baselineEvent || !activeEvent) reason = "length";
    else if (baselineEvent.letter !== activeEvent.letter)
      reason = "instruction";
    else if (baselineEvent.path.transform.id !== activeEvent.path.transform.id)
      reason = "transform";
    else if (
      baselineEvent.before.some(
        (value, register) => value !== activeEvent.before[register],
      )
    )
      reason = "before-state";
    else if (
      baselineEvent.after.some(
        (value, register) => value !== activeEvent.after[register],
      )
    )
      reason = "after-state";

    if (!reason) continue;

    const baselineState = baselineEvent?.after ?? baseline.finalState;
    const activeState = activeEvent?.after ?? active.finalState;
    const changedRegisters = Array.from(
      { length: Math.max(baselineState.length, activeState.length) },
      (_, register) => register,
    ).filter((register) => baselineState[register] !== activeState[register]);

    return {
      step: index + 1,
      reason,
      baselineInstruction: baselineEvent?.letter ?? null,
      activeInstruction: activeEvent?.letter ?? null,
      baselineRoute: baselineEvent
        ? `${baselineEvent.path.source}→${baselineEvent.path.destination}`
        : "∅",
      activeRoute: activeEvent
        ? `${activeEvent.path.source}→${activeEvent.path.destination}`
        : "∅",
      baselineTransform: baselineEvent?.path.transform.id ?? "∅",
      activeTransform: activeEvent?.path.transform.id ?? "∅",
      baselineStateHash: stateHash(baselineState),
      activeStateHash: stateHash(activeState),
      changedRegisters,
    };
  }

  return null;
}
