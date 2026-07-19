import { describe, expect, it } from "vitest";
import {
  compareOrSeeds,
  compareProgramRuns,
  findFirstTraceDivergence,
  FULL_PATHS,
  HEBREW_ALPHABET,
  manifestationExport,
  OR_PATHS,
  runOrVerticalSlice,
  runProgram,
  serializeManifestation,
  TRANSFORM_REGISTRY,
} from "../src/machine.js";

describe("אור vertical slice", () => {
  it("uses exactly 23 registers throughout execution", () => {
    const result = runOrVerticalSlice(9);
    expect(result.initialState).toHaveLength(23);
    expect(result.finalState).toHaveLength(23);
    result.pathEvents.forEach((event) => {
      expect(event.before).toHaveLength(23);
      expect(event.after).toHaveLength(23);
    });
  });

  it("executes three configured paths and composes two gates", () => {
    const result = runOrVerticalSlice(9);
    expect(result.pathEvents.map((event) => event.letter).join("")).toBe("אור");
    expect(Object.keys(OR_PATHS)).toEqual(["א", "ו", "ר"]);
    expect(result.gates.map((gate) => gate.id)).toEqual(["א־ו", "ו־ר"]);
    expect(result.gates[1]?.sharedNodes).toContain("Yesod");
    expect(result.gates[1]?.route).toEqual([
      "Hod",
      "Yesod",
      "Yesod",
      "Malchut",
    ]);
    expect(result.gates[1]?.sharedServices).toContain("YesodBus");
    expect(result.gates[1]?.registerChanges).toBeGreaterThan(0);
  });

  it("derives gate metrics from the paired path events", () => {
    const result = runOrVerticalSlice(9);
    const [first, second] = result.gates;
    expect(first?.composition).toBe("crossing");
    expect(first?.sharedNodes).toEqual([]);
    expect(first?.sharedServices).toEqual(["BinahCompiler", "GevurahPolicy"]);
    expect(second?.composition).toBe("continuation");
    expect(second?.coherenceDelta).toBe(
      Number(
        (
          result.pathEvents[2]!.coherence.coherence -
          result.pathEvents[1]!.coherence.coherence
        ).toFixed(3),
      ),
    );
  });

  it("is reproducible for the same seed", () => {
    expect(runOrVerticalSlice(9)).toEqual(runOrVerticalSlice(9));
  });

  it("keeps every simulated value within its declared range", () => {
    const result = runOrVerticalSlice(9);
    result.pathEvents.forEach(({ coherence }) => {
      expect(coherence.activation).toBeGreaterThanOrEqual(0);
      expect(coherence.activation).toBeLessThanOrEqual(1);
      expect(coherence.phase).toBeGreaterThanOrEqual(0);
      expect(coherence.phase).toBeLessThan(Math.PI * 2);
      expect(coherence.coherence).toBeGreaterThanOrEqual(0);
      expect(coherence.coherence).toBeLessThanOrEqual(1);
    });
  });

  it("creates three deterministic observation projections and selects one", () => {
    const first = runOrVerticalSlice(9).observation;
    const second = runOrVerticalSlice(9).observation;
    expect(first).toEqual(second);
    expect(first.candidates).toHaveLength(3);
    expect(first.candidates.map((candidate) => candidate.id)).toContain(
      first.selectedProjection,
    );
    first.candidates.forEach((candidate) => {
      expect(candidate.confidence).toBeGreaterThanOrEqual(0.5);
      expect(candidate.confidence).toBeLessThanOrEqual(1);
      expect(candidate.stateHash).toMatch(/^[0-9a-f]{8}$/);
    });
  });

  it("records the final state as an immutable observation snapshot", () => {
    const result = runOrVerticalSlice(9);
    expect(result.observation.snapshot).toEqual(result.finalState);
    expect(result.observation.reason).toBe("program-end");
  });

  it("manifests the observed state in multiple deterministic formats", () => {
    const result = runOrVerticalSlice(9);
    expect(result.manifestation.registerString).toHaveLength(22);
    expect(result.manifestation.base22Registers.split(" ")).toHaveLength(23);
    expect(result.manifestation.pathSignature).toContain("א:Keter>Tiferet");
    expect(result.manifestation.checksum).toMatch(/^[0-9a-f]{8}$/);
    expect(runOrVerticalSlice(9).manifestation).toEqual(result.manifestation);
  });

  it("serializes a complete, reproducible manifestation trace", () => {
    const result = runOrVerticalSlice(9);
    const exported = manifestationExport(result);
    expect(exported.schemaVersion).toBe("qec-manifestation-0.2");
    expect(exported.finalState).toEqual(result.observation.snapshot);
    expect(exported.paths).toHaveLength(3);
    expect(exported.gates).toHaveLength(2);
    expect(serializeManifestation(result)).toBe(serializeManifestation(result));
    expect(JSON.parse(serializeManifestation(result))).toEqual(exported);
  });

  it("keeps all register values in base 22", () => {
    const result = runOrVerticalSlice(9);
    result.pathEvents.forEach(({ after }) =>
      after.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(HEBREW_ALPHABET.length);
      }),
    );
  });

  it("rejects an invalid Aleph Olam digit", () => {
    expect(() => runOrVerticalSlice(22)).toThrow(RangeError);
  });

  it("uses Aleph Olam as orientation without flattening registers", () => {
    const comparison = compareOrSeeds(4, 9);
    expect(comparison.changedVisibleRegisters).toBeGreaterThan(0);
    expect(comparison.activeDistinctValues).toBe(22);
    expect(comparison.activeChecksum).not.toBe(comparison.baselineChecksum);
    expect(comparison.activeFirstLetter).not.toBe(
      comparison.baselineFirstLetter,
    );
  });

  it("reports no differences when comparing an identical seed", () => {
    const comparison = compareOrSeeds(9, 9);
    expect(comparison.changedVisibleRegisters).toBe(0);
    expect(comparison.coherenceDelta).toBe(0);
    expect(comparison.observationChanged).toBe(false);
    expect(comparison.activeChecksum).toBe(comparison.baselineChecksum);
  });

  it("produces reproducible seed-comparison metrics", () => {
    expect(compareOrSeeds(17, 9)).toEqual(compareOrSeeds(17, 9));
  });
});

describe("complete IvritCode runtime", () => {
  it("executes all 22 instructions and composes 21 adjacent gates", () => {
    const program = HEBREW_ALPHABET.join("");
    const result = runProgram(program, 9);

    expect(result.program).toBe(program);
    expect(result.pathEvents).toHaveLength(22);
    expect(result.gates).toHaveLength(21);
    expect(result.pathEvents.map((event) => event.letter)).toEqual(
      HEBREW_ALPHABET,
    );
    expect(result.finalState).toHaveLength(23);
  });

  it("registers one compatible transform for every configured path", () => {
    Object.values(FULL_PATHS).forEach((path) => {
      const transform =
        TRANSFORM_REGISTRY[
          path.transform.id as keyof typeof TRANSFORM_REGISTRY
        ];
      expect(transform).toBeDefined();
      expect(transform?.operation).toBe(path.operation);
      expect(path.transform.version).toBe("0.3.0");
    });
    expect(Object.keys(TRANSFORM_REGISTRY)).toHaveLength(22);
  });

  it("keeps arbitrary-program state bounded and reproducible", () => {
    const program = "שלום";
    const first = runProgram(program, 17);
    const second = runProgram(program, 17);

    expect(first).toEqual(second);
    first.pathEvents.forEach((event) =>
      event.after.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(22);
      }),
    );
  });

  it("normalizes input and rejects empty or unsupported programs", () => {
    expect(runProgram("אור", 9)).toEqual(runOrVerticalSlice(9));
    expect(() => runProgram("", 9)).toThrow(SyntaxError);
    expect(() => runProgram("A", 9)).toThrow(SyntaxError);
  });
});

describe("trace comparison", () => {
  it("reports no divergence for identical runs", () => {
    const run = runProgram("אור", 9);
    const comparison = compareProgramRuns(run, runProgram("אור", 9));

    expect(comparison.commonPathPrefix).toBe(3);
    expect(comparison.changedFinalRegisters).toBe(0);
    expect(comparison.pathDelta).toBe(0);
    expect(comparison.gateDelta).toBe(0);
    expect(comparison.coherenceDelta).toBe(0);
    expect(comparison.observationChanged).toBe(false);
    expect(comparison.activeChecksum).toBe(comparison.baselineChecksum);
  });

  it("pinpoints path and state divergence between programs", () => {
    const baseline = runProgram("אור", 9);
    const active = runProgram("שלום", 17);
    const comparison = compareProgramRuns(baseline, active);
    const divergence = findFirstTraceDivergence(baseline, active);

    expect(comparison.commonPathPrefix).toBe(0);
    expect(comparison.changedFinalRegisters).toBeGreaterThan(0);
    expect(comparison.pathDelta).toBe(1);
    expect(comparison.gateDelta).toBe(1);
    expect(comparison.activeChecksum).not.toBe(comparison.baselineChecksum);
    expect(divergence).toMatchObject({
      step: 1,
      reason: "instruction",
      baselineInstruction: "א",
      activeInstruction: "ש",
      baselineRoute: "Keter→Tiferet",
      activeRoute: "Tiferet→Yesod",
    });
    expect(divergence?.changedRegisters.length).toBeGreaterThan(0);
    expect(divergence?.baselineStateHash).toMatch(/^[0-9a-f]{8}$/);
  });

  it("returns no divergence for byte-equivalent traces", () => {
    expect(
      findFirstTraceDivergence(runProgram("שלום", 17), runProgram("שלום", 17)),
    ).toBeNull();
  });
});
