import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  compileIvritToOpenQasm,
  IVRIT_OPENQASM_GATES,
  normalizeIvritSource,
} from "../src/openqasm.js";

describe("IvritCode OpenQASM 3 projection", () => {
  it("publishes one explicit mapping for every Hebrew letter", () => {
    expect(IVRIT_OPENQASM_GATES).toHaveLength(22);
    expect(IVRIT_OPENQASM_GATES.map(({ letter }) => letter).join("")).toBe(
      "אבגדהוזחטיכלמנסעפצקרשת",
    );
  });

  it("keeps the executable mapping identical to the published profile", () => {
    const profile = JSON.parse(
      readFileSync(
        fileURLToPath(
          new URL(
            "../specifications/ivritcode-openqasm-v0.1.json",
            import.meta.url,
          ),
        ),
        "utf8",
      ),
    ) as { mappings: typeof IVRIT_OPENQASM_GATES };
    expect(profile.mappings).toEqual(IVRIT_OPENQASM_GATES);
  });

  it("emits deterministic OpenQASM 3 with measurement", () => {
    const qasm = compileIvritToOpenQasm("אור");
    expect(qasm).toContain("OPENQASM 3.0;");
    expect(qasm).toContain('include "stdgates.inc";');
    expect(qasm).toContain("p(0) q[0];");
    expect(qasm).toContain("s q[1];");
    expect(qasm).toContain("cry(pi/2) q[2], q[0];");
    expect(qasm).toContain("result = measure q;");
    expect(compileIvritToOpenQasm("אור")).toBe(qasm);
  });

  it("normalizes final forms and removes Hebrew marks", () => {
    expect(normalizeIvritSource("שָׁלוֹם")).toBe("שלומ");
    expect(compileIvritToOpenQasm("מֶלֶךְ")).toContain(
      "// IvritCode source: מלכ",
    );
  });

  it("fails closed on unsupported text and invalid target sizes", () => {
    expect(() => compileIvritToOpenQasm("light")).toThrow(SyntaxError);
    expect(() => compileIvritToOpenQasm("אור", 2)).toThrow(RangeError);
  });
});
