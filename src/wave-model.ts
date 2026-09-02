import {
  HEBREW_ALPHABET,
  runProgram,
  type ObservationProjection,
  type ProgramExecutionResult,
} from "./machine.js";

export type WaveProjectionId = ObservationProjection["id"];

export interface InfiniteWaveProjection {
  id: WaveProjectionId;
  label: string;
  rationale: string;
  stateHash: string;
  focusLetter: string;
  confidence: number;
  selected: boolean;
  values: readonly number[];
  distinctValues: number;
  meanValue: number;
}

export interface InfiniteWaveModel {
  schemaVersion: "qec-infinite-wave-0.1";
  run: ProgramExecutionResult;
  source: {
    program: string;
    seed: number;
    registerCount: 23;
  };
  transformations: readonly {
    step: number;
    letter: string;
    route: string;
    transform: string;
    coherence: number;
  }[];
  projections: readonly InfiniteWaveProjection[];
  observer: {
    boundary: "Da’at";
    selectedProjection: WaveProjectionId;
    stateHash: string;
    traceHash: string;
  };
  result: {
    boundary: "Malchut";
    registerString: string;
    checksum: string;
    pathSignature: string;
  };
}

function valuesForProjection(
  id: WaveProjectionId,
  finalState: readonly number[],
  seed: number,
): readonly number[] {
  const visible = finalState.slice(0, 22);
  if (id === "mirror-order") return [...visible].reverse();
  if (id === "phase-offset") return visible.map((value) => (value + seed) % 22);
  return visible;
}

export function buildInfiniteWaveModel(
  program: string,
  seed = 9,
): InfiniteWaveModel {
  const run = runProgram(program, seed);
  const selectedProjection = run.observation
    .selectedProjection as WaveProjectionId;
  const projections = run.observation.candidates.map((candidate) => {
    const values = valuesForProjection(candidate.id, run.finalState, seed);
    return {
      ...candidate,
      selected: candidate.id === selectedProjection,
      values,
      distinctValues: new Set(values).size,
      meanValue: Number(
        (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(
          3,
        ),
      ),
    };
  });

  return {
    schemaVersion: "qec-infinite-wave-0.1",
    run,
    source: {
      program: run.program,
      seed,
      registerCount: 23,
    },
    transformations: run.pathEvents.map((event) => ({
      step: event.step,
      letter: event.letter,
      route: `${event.path.source} → ${event.path.destination}`,
      transform: event.path.transform.id,
      coherence: event.coherence.coherence,
    })),
    projections,
    observer: {
      boundary: "Da’at",
      selectedProjection,
      stateHash: run.observation.stateHash,
      traceHash: run.observation.traceHash,
    },
    result: {
      boundary: "Malchut",
      registerString: run.manifestation.registerString,
      checksum: run.manifestation.checksum,
      pathSignature: run.manifestation.pathSignature,
    },
  };
}

export function registerLabels(): readonly string[] {
  return [...HEBREW_ALPHABET];
}
