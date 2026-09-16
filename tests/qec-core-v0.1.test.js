import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const context = {};
runInNewContext(
  readFileSync(new URL("../qec/core.js", import.meta.url), "utf8"),
  context,
);
const QEC = context.QECCore;

describe("QEC v0.1 browser core", () => {
  it("uses the 22 unique canonical Hebrew letters", () => {
    expect(QEC.LETTERS).toHaveLength(22);
    expect(new Set(QEC.LETTERS.map((item) => item.letter))).toHaveLength(22);
  });

  it("builds exactly 231 unique unordered gates with 22 approved directions", () => {
    expect(QEC.GATES).toHaveLength(231);
    expect(new Set(QEC.GATES.map((item) => item.id))).toHaveLength(231);
    expect(QEC.GATES.every((item) => item.left !== item.right)).toBe(true);
    expect(QEC.GATE_RULE_PROFILE).toBe("qec-gate-rules-0.1");
    expect(QEC.GATE_EVIDENCE_PROGRAMS).toHaveLength(8);
    const approved = QEC.GATES.filter((item) => item.status === "approved");
    expect(approved).toHaveLength(22);
    expect(approved).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "gate-1-6", executable: true }),
        expect.objectContaining({ id: "gate-6-12", executable: true }),
        expect.objectContaining({ id: "gate-6-13", executable: true }),
        expect.objectContaining({ id: "gate-6-20", executable: true }),
        expect.objectContaining({ id: "gate-12-21", executable: true }),
      ]),
    );
    expect(
      QEC.GATES.filter((item) => item.status === "reserved").every(
        (item) => !item.executable,
      ),
    ).toBe(true);
  });

  it("compiles and resolves the acceptance program deterministically", () => {
    const first = QEC.execute("יִ $r1, 5");
    const second = QEC.execute("יִ $r1, 5");

    expect(first.ok).toBe(true);
    expect(first.state.$r1).toBe(5);
    expect(first.ir.type).toBe("IntegerAdd");
    expect(first.events.map((event) => event.stage)).toEqual([...QEC.STAGES]);
    expect(first.traceHash).toBe(second.traceHash);
  });

  it("includes the initial register state in execution", () => {
    expect(QEC.execute("יִ $r1, 5", { $r1: 7 }).state.$r1).toBe(12);
  });

  it("keeps Aleph Olam disabled and grants no capability", () => {
    expect(QEC.createManifest("יִ $r1, 5").alephOlam).toEqual({
      enabled: false,
      capabilityGrant: false,
    });
  });

  it("bounds manifest budgets and capabilities before execution", () => {
    expect(() => QEC.createManifest("יִ $r1, 5", { steps: 0 })).toThrow(
      /Step budget/,
    );
    expect(() => QEC.createManifest("יִ $r1, 5", { steps: 10001 })).toThrow(
      /Step budget/,
    );
    expect(() =>
      QEC.createManifest("יִ $r1, 5", { capabilities: ["read", "read"] }),
    ).toThrow(/unique/);
    expect(QEC.createManifest("יִ $r1, 5", { steps: 1 }).budget.steps).toBe(1);
  });

  it("denies an unknown opcode with an auditable terminal event", () => {
    const result = QEC.execute("אִ $r1, 5");
    expect(result.ok).toBe(false);
    expect(result.events.at(-1).stage).toBe("malkhut");
    expect(result.events.at(-1).status).toBe("denied");
  });
});
