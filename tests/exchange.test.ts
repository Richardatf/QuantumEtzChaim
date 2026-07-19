import { describe, expect, it } from "vitest";
import { activationNodes } from "../src/main.js";
import {
  EXCHANGE_VERSION,
  readExchange,
  type IvritCodeExchange,
} from "../src/exchange.js";
const fixture = {
  schemaVersion: EXCHANGE_VERSION,
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
});
