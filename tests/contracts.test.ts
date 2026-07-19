import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import type { AnySchema } from "ajv";
import { describe, expect, it } from "vitest";
import {
  HEBREW_ALPHABET,
  manifestationExport,
  runProgram,
  runOrVerticalSlice,
} from "../src/machine.js";

const schemaDirectory = fileURLToPath(
  new URL("../specifications/schemas/", import.meta.url),
);

function readJson(path: string): AnySchema {
  return JSON.parse(readFileSync(path, "utf8")) as AnySchema;
}

interface PathMapFixture {
  integrity: { digest: string };
  paths: readonly { letter: string; transform: { id: string } }[];
}

function readPathMap(name: string): PathMapFixture {
  return JSON.parse(
    readFileSync(
      fileURLToPath(new URL(`../specifications/${name}`, import.meta.url)),
      "utf8",
    ),
  ) as PathMapFixture;
}

function pathsDigest(paths: PathMapFixture["paths"]): string {
  return createHash("sha256").update(JSON.stringify(paths)).digest("hex");
}

const schemaFiles = readdirSync(schemaDirectory)
  .filter((name) => name.endsWith(".schema.json"))
  .sort();
const schemas = schemaFiles.map((name) =>
  readJson(`${schemaDirectory}/${name}`),
);

describe("qec contract pack", () => {
  it("publishes and compiles all five required schemas", () => {
    expect(schemaFiles).toEqual([
      "machine-state-v0.3.schema.json",
      "manifestation-v0.2.schema.json",
      "observation-v0.3.schema.json",
      "path-map-v0.3.schema.json",
      "trace-v0.3.schema.json",
    ]);

    const ajv = new Ajv2020({ allErrors: true, strict: true });
    schemas.forEach((schema) =>
      expect(() => ajv.compile(schema)).not.toThrow(),
    );
  });

  it("validates the vertical-slice and complete path maps", () => {
    const ajv = new Ajv2020({ allErrors: true });
    const schema = readJson(`${schemaDirectory}/path-map-v0.3.schema.json`);
    ["qec-or-paths-v0.1.json", "qec-paths-v0.3.json"].forEach((name) => {
      const fixture = readPathMap(name);
      expect(ajv.validate(schema, fixture), JSON.stringify(ajv.errors)).toBe(
        true,
      );
      expect(pathsDigest(fixture.paths)).toBe(fixture.integrity.digest);
    });
  });

  it("covers every Hebrew letter exactly once with a named transform", () => {
    const fixture = readPathMap("qec-paths-v0.3.json");
    const letters = fixture.paths.map((path) => path.letter);

    expect(letters).toEqual(HEBREW_ALPHABET);
    expect(new Set(letters).size).toBe(22);
    expect(fixture.paths.every((path) => path.transform.id.length > 0)).toBe(
      true,
    );
  });

  it("validates a real manifestation export and rejects an invalid seed", () => {
    const ajv = new Ajv2020({ allErrors: true });
    const schema = readJson(
      `${schemaDirectory}/manifestation-v0.2.schema.json`,
    );
    const validate = ajv.compile(schema);
    const validExport = manifestationExport(runOrVerticalSlice(9));
    expect(validate(validExport), JSON.stringify(validate.errors)).toBe(true);

    const arbitraryExport = manifestationExport(runProgram("שלום", 17));
    expect(validate(arbitraryExport), JSON.stringify(validate.errors)).toBe(
      true,
    );
    expect(arbitraryExport.program).toBe("שלומ");

    const invalidExport = { ...validExport, seed: 22 };
    expect(validate(invalidExport)).toBe(false);
    expect(validate.errors?.some((error) => error.keyword === "maximum")).toBe(
      true,
    );
  });
});
