import { describe, expect, it } from "vitest";
import { parseRunPassport } from "../src/passport.js";
import { contentHash } from "@qec/spec";

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
});
