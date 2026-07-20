import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runProgram, traceExport } from "../src/machine.js";

const seeds = [9, 0, 5, 13, 21] as const;
const directory = fileURLToPath(
  new URL("./fixtures/golden-traces/", import.meta.url),
);
const canonical = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

describe("canonical golden traces", () => {
  for (const seed of seeds) {
    it(`keeps אור / seed ${String(seed).padStart(2, "0")} byte-stable`, () => {
      const file = `${directory}/or-seed-${String(seed).padStart(2, "0")}.json`;
      const generated = canonical(traceExport(runProgram("אור", seed)));
      if (process.env.UPDATE_GOLDENS === "1") {
        mkdirSync(directory, { recursive: true });
        writeFileSync(file, generated, "utf8");
      }
      expect(readFileSync(file, "utf8")).toBe(generated);
    });
  }
});
