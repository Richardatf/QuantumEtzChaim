import { describe, expect, it } from "vitest";
import { activationNodes } from "../src/main.js";
import {
  EXCHANGE_VERSION,
  readExchange,
  readRunPassport,
  type IvritCodeExchange,
} from "../src/exchange.js";
import {
  IVRIT_ENGINE_VERSION,
  QEC_MANIFESTATION_VERSION,
  QEC_PATH_MAP_VERSION,
  contentHash,
} from "@qec/spec";
const fixture = {
  schemaVersion: EXCHANGE_VERSION,
  engineVersion: IVRIT_ENGINE_VERSION,
  pathMapVersion: QEC_PATH_MAP_VERSION,
  manifestationVersion: QEC_MANIFESTATION_VERSION,
  seed: 9,
  traceHash: "fnv1a32-complete-trace",
  source: "אור",
  sourceHash: "test",
  initialState: [...Array.from({ length: 22 }, (_, i) => i), 0],
  finalState: [...Array.from({ length: 22 }, (_, i) => i), 9],
  hiddenKey: "י",
  patternShape: "STILL_POINT",
  returningLetters: ["א", "ו", "ר"],
  gates: ["א־ו", "ו־ר"],
} satisfies IvritCodeExchange;
describe("IvritCode integration", () => {
  it("reads a valid exchange", () =>
    expect(
      readExchange(`?exchange=${encodeURIComponent(JSON.stringify(fixture))}`),
    ).toEqual(fixture));
  it("rejects invalid register data", () =>
    expect(
      readExchange(
        `?exchange=${encodeURIComponent(JSON.stringify({ ...fixture, finalState: [1] }))}`,
      ),
    ).toBeUndefined());
  it("maps the same exchange to the same tree nodes", () =>
    expect(activationNodes(fixture)).toEqual(activationNodes(fixture)));
  it("accepts a complete run passport and rejects a broken trace", () => {
    const trace = [
      {
        sequence: 0,
        letter: fixture.source[0],
        before: fixture.initialState,
        after: fixture.finalState,
        beforeHash: contentHash(fixture.initialState),
        afterHash: contentHash(fixture.finalState),
        changedRegisters: [22],
      },
    ];
    const traceHash = contentHash(trace);
    const passport = {
      ...fixture,
      schemaVersion: "qec-run-passport-0.1",
      sourceHash: contentHash({ source: fixture.source }),
      traceHash,
      runId: traceHash,
      legacyTrace: [
        {
          sequence: 0,
          letter: "א",
          before: fixture.initialState,
          after: fixture.finalState,
          beforeHash: "fnv1a32-11111111",
          afterHash: "fnv1a32-22222222",
          changedRegisters: [0],
        },
      ],
      trace,
      validation: {
        status: "valid",
        registerCount: 23,
        traceComplete: true,
        deterministic: true,
      },
    };
    const { legacyTrace: _legacyTrace, ...cleanPassport } = passport;
    const query = `?passport=${encodeURIComponent(JSON.stringify(cleanPassport))}`;
    expect(readRunPassport(query)).toEqual(cleanPassport);
    expect(
      readRunPassport(
        `?passport=${encodeURIComponent(JSON.stringify({ ...cleanPassport, trace: [] }))}`,
      ),
    ).toBeUndefined();
  });
});
