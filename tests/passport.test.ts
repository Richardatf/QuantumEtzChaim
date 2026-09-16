import { describe, expect, it } from "vitest";
import {
  addRunEvidence,
  createRunPassport,
  parseRunPassport,
  validateRunPassport,
} from "../src/passport.js";
import { runProgram } from "../src/machine.js";
import { contentHash, inspectRunPassport } from "@qec/spec";

const state = [...Array.from({ length: 22 }, (_, index) => index), 9];
const trace = [
  {
    sequence: 0,
    letter: "א",
    before: state,
    after: state,
    beforeHash: contentHash(state),
    afterHash: contentHash(state),
    changedRegisters: [],
  },
];
const traceHash = contentHash(trace);
const passport = {
  schemaVersion: "qec-run-passport-0.1",
  runId: traceHash,
  engineVersion: "1.0.0",
  pathMapVersion: "qec-path-map-0.3.0",
  manifestationVersion: "qec-manifestation-0.2",
  seed: 9,
  traceHash,
  source: "אור",
  sourceHash: contentHash({ source: "אור" }),
  initialState: state,
  finalState: state,
  hiddenKey: "י",
  patternShape: "STILL_POINT",
  returningLetters: ["א"],
  gates: ["א־ו"],
  trace,
  validation: {
    status: "valid",
    registerCount: 23,
    traceComplete: true,
    deterministic: true,
  },
};

describe("Run Passport file parser", () => {
  it("accepts a canonical passport", () =>
    expect(parseRunPassport(JSON.stringify(passport))).toMatchObject({
      ok: true,
    }));
  it("rejects malformed and structurally invalid files", () => {
    expect(parseRunPassport("not-json")).toEqual({
      ok: false,
      error: "Passport is not valid JSON.",
    });
    expect(
      parseRunPassport(JSON.stringify({ ...passport, trace: [] })),
    ).toMatchObject({ ok: false });
  });
  it("reports tampered state hashes", () =>
    expect(
      parseRunPassport(
        JSON.stringify({
          ...passport,
          trace: [{ ...trace[0], after: [...state.slice(0, 22), 8] }],
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: expect.stringContaining("event-0-after-hash"),
    }));

  it("uses the canonical passport as the machine workflow spine", () => {
    const generated = createRunPassport(runProgram("אור", 9));
    const machine = generated.extensions.qecMachine;

    expect(inspectRunPassport(generated).valid).toBe(true);
    expect(validateRunPassport(generated)).toBe(true);
    expect(machine.panel.frames).toHaveLength(3);
    expect(machine.panel.frames[0]?.traceHash).toBe(generated.traceHash);
    expect(machine.trace.completeTraceHash).toBe(
      generated.extensions.qecMachine.trace.completeTraceHash,
    );
    expect(machine.manifestation.output.checksum).toMatch(/^[0-9a-f]{8}$/);
    expect(machine.openQasm.source).toContain("OPENQASM 3.0;");
    expect(machine.evidence.openQasmValidation).toMatchObject({
      profile: "qec-openqasm-validation-0.1",
      status: "PASS",
      programId: "or-seed-09",
      normalizedSource: "אור",
      seed: 9,
      openQasmSha256:
        "e0dda19344f486191a5520968cabdc844e30bcb2cbd786d76fd17d3689fa8101",
    });
    expect(parseRunPassport(JSON.stringify(generated))).toMatchObject({
      ok: true,
    });
  });

  it("rejects a machine extension that diverges from the canonical run", () => {
    const generated = createRunPassport(runProgram("אור", 9));
    const broken = structuredClone(generated);
    broken.extensions.qecMachine.panel.frames[0]!.brightness = 0.26;

    expect(validateRunPassport(broken)).toBe(false);
    expect(parseRunPassport(JSON.stringify(broken))).toMatchObject({
      ok: false,
      error: expect.stringContaining("machine-panel-divergence"),
    });
  });

  it("binds simulated or physical acknowledgements to the same passport", () => {
    const generated = createRunPassport(runProgram("אור", 9));
    const completed = addRunEvidence(generated, {
      mode: "physical",
      acknowledgements: [
        { type: "READY", protocol: "qec-panel-link-0.1", pixels: 4, keys: 4 },
        { type: "APPLIED", sequence: 1 },
      ],
      acceptance: { handshake: "PASS", states: "PASS" },
    });

    expect(completed.runId).toBe(generated.runId);
    expect(completed.extensions.qecMachine.evidence.mode).toBe("physical");
    expect(
      completed.extensions.qecMachine.evidence.openQasmValidation?.programId,
    ).toBe("or-seed-09");
    expect(validateRunPassport(completed)).toBe(true);
  });
});
