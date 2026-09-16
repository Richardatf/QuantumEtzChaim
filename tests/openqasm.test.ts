import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  compileIvritToOpenQasm,
  compileIvritToOpenQasm31,
  IVRIT_OPENQASM_GATES,
  IVRIT_OPENQASM_PROFILE_30,
  IVRIT_OPENQASM_PROFILE_31,
  normalizeIvritSource,
} from "../src/openqasm.js";

function fixture(path: string): string {
  return readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
}

describe("IvritCode OpenQASM projection", () => {
  it("publishes one explicit mapping for every Hebrew letter", () => {
    expect(IVRIT_OPENQASM_GATES).toHaveLength(22);
    expect(IVRIT_OPENQASM_GATES.map(({ letter }) => letter).join("")).toBe(
      "אבגדהוזחטיכלמנסעפצקרשת",
    );
  });

  it("keeps both executable mappings identical to their published profiles", () => {
    for (const [name, expectedId] of [
      ["v0.1", IVRIT_OPENQASM_PROFILE_30],
      ["v0.2", IVRIT_OPENQASM_PROFILE_31],
    ] as const) {
      const profile = JSON.parse(
        fixture(`../specifications/ivritcode-openqasm-${name}.json`),
      ) as { id: string; mappings: typeof IVRIT_OPENQASM_GATES };
      expect(profile.id).toBe(expectedId);
      expect(profile.mappings).toEqual(IVRIT_OPENQASM_GATES);
    }
  });

  it("keeps profile 0.1 frozen as deterministic OpenQASM 3.0", () => {
    const qasm = compileIvritToOpenQasm("אור");
    expect(qasm).toContain("OPENQASM 3.0;");
    expect(qasm).toContain(
      `QEC projection profile: ${IVRIT_OPENQASM_PROFILE_30}`,
    );
    expect(qasm).toContain('include "stdgates.inc";');
    expect(qasm).toContain("p(0) q[0];");
    expect(qasm).toContain("s q[1];");
    expect(qasm).toContain("cry(pi/2) q[2], q[0];");
    expect(qasm).toContain("result = measure q;");
    expect(compileIvritToOpenQasm("אור")).toBe(qasm);
    expect(qasm).toBe(fixture("./fixtures/openqasm/or-seed-09.qasm").trimEnd());
  });

  it("emits a parallel OpenQASM 3.1 semantic-hold profile", () => {
    const q30 = compileIvritToOpenQasm("שלום");
    const q31 = compileIvritToOpenQasm31("שלום");
    expect(q31).toContain("OPENQASM 3.1;");
    expect(q31).toContain(
      `QEC projection profile: ${IVRIT_OPENQASM_PROFILE_31}`,
    );
    expect(q31).toBe(
      fixture("./fixtures/openqasm31/shalom-seed-17.qasm").trimEnd(),
    );
    expect(
      q31
        .replace("OPENQASM 3.1;", "OPENQASM 3.0;")
        .replace(IVRIT_OPENQASM_PROFILE_31, IVRIT_OPENQASM_PROFILE_30),
    ).toBe(q30);
  });

  it("normalizes final forms and removes Hebrew marks for both targets", () => {
    expect(normalizeIvritSource("שָׁלוֹם")).toBe("שלומ");
    expect(compileIvritToOpenQasm("מֶלֶךְ")).toContain(
      "// IvritCode source: מלכ",
    );
    expect(compileIvritToOpenQasm31("מֶלֶךְ")).toContain(
      "// IvritCode source: מלכ",
    );
  });

  it("fails closed on unsupported text and invalid target sizes", () => {
    expect(() => compileIvritToOpenQasm("light")).toThrow(SyntaxError);
    expect(() => compileIvritToOpenQasm31("light")).toThrow(SyntaxError);
    expect(() => compileIvritToOpenQasm("אור", 2)).toThrow(RangeError);
    expect(() => compileIvritToOpenQasm31("אור", 33)).toThrow(RangeError);
  });
});
