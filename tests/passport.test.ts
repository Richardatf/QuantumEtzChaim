import { describe, expect, it } from "vitest";
import { parseRunPassport } from "../src/passport.js";

const state = [...Array.from({ length: 22 }, (_, index) => index), 9];
const passport = {
  schemaVersion: "qec-run-passport-0.1",
  runId: "fnv1a32-12345678",
  engineVersion: "1.0.0",
  pathMapVersion: "qec-path-map-0.3.0",
  manifestationVersion: "qec-manifestation-0.2",
  seed: 9,
  traceHash: "fnv1a32-12345678",
  source: "אור",
  sourceHash: "fnv1a32-87654321",
  initialState: state,
  finalState: state,
  hiddenKey: "י",
  patternShape: "STILL_POINT",
  returningLetters: ["א"],
  gates: ["א־ו"],
  trace: [
    {
      sequence: 0,
      letter: "א",
      before: state,
      after: state,
      beforeHash: "fnv1a32-11111111",
      afterHash: "fnv1a32-11111111",
      changedRegisters: [],
    },
  ],
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
    ).toEqual({
      ok: false,
      error: "JSON does not satisfy qec-run-passport-0.1.",
    });
  });
});
