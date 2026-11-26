import { describe, expect, it } from "vitest";
import {
  executeLab,
  inspectLab,
  LAB_EXAMPLES,
  labPermalink,
  readLabPermalink,
  type LabInput,
} from "../src/ivritcode-lab.js";
import { createIvritCodeMachineRun } from "../src/ivritcode-bridge.js";
import { inspectUnifiedRunPassport } from "../src/passport.js";

const integer: LabInput = {
  source: "יִ $r1, 5",
  profile: "integer",
  seed: 9,
  initialR1: 7,
};
const tree: LabInput = {
  source: "שלום",
  profile: "tree",
  seed: 9,
  initialR1: 0,
};

describe("integrated IvritCode workbench", () => {
  it("executes typed arithmetic through the shared compiler, verification, and sandbox", () => {
    const result = executeLab(integer);
    expect(result.profile).toBe("integer");
    if (result.profile !== "integer") return;
    expect(result.inspection.compilation.pythonSource).toContain(
      "r1 = int(r1) + 5",
    );
    expect(result.sandbox.result.outputs).toEqual({ r1: 12 });
    expect(result.sandbox.verification.verified).toBe(true);
    expect(
      result.sandbox.trace.events.find((event) => event.stage === "Daat")
        ?.status,
    ).toBe("passed");
    expect(
      result.sandbox.trace.events.find((event) => event.stage === "Chesed")
        ?.status,
    ).toBe("skipped");
    expect(
      result.sandbox.trace.events.find((event) => event.stage === "Netzach")
        ?.status,
    ).toBe("skipped");
    expect(result.sandbox.policy.grantedCapabilities).toEqual([
      "sandbox.execute",
    ]);
    expect(result.sandbox.result.warnings).toEqual([]);
  });

  it("preserves original final forms and produces a replayable machine Run Passport", () => {
    const first = executeLab(tree);
    const replay = executeLab(tree);
    expect(first.profile).toBe("tree");
    if (first.profile !== "tree" || replay.profile !== "tree") return;
    expect(first.inspection.compilation.program.source).toBe("שלום");
    expect(first.machine.opcodeStream).toBe("שלומ");
    expect(first.machine.execution.finalState).toHaveLength(23);
    expect(first.machine.passport).toEqual(replay.machine.passport);
    expect(inspectUnifiedRunPassport(first.machine.passport).valid).toBe(true);
    expect(
      first.machine.passport.extensions.qecMachine.openQasm.source,
    ).toContain("OPENQASM 3.0;");
  });

  it.each(LAB_EXAMPLES)(
    "runs lesson $id using its declared profile",
    (example) => {
      expect(() =>
        executeLab({
          ...tree,
          source: example.source,
          profile: example.profile,
        }),
      ).not.toThrow();
    },
  );

  it("preserves comments, graphemes, source offsets, and input values through study links", () => {
    const original = {
      ...integer,
      source: "# original: 🙂\nיִ $r1, 5\nיִ $r1, -2",
      initialR1: -4,
    };
    const url = labPermalink(
      "https://quantumetzchaim.com/ivritcode.html?old=1#editor",
      original,
    );
    const restored = readLabPermalink(url);
    expect(restored).toEqual(original);
    expect(new URL(url).hash).toBe("");
    const inspected = inspectLab(restored!);
    for (const token of inspected.compilation.program.tokens) {
      expect(original.source.slice(token.start, token.end)).toBe(token.text);
    }
    expect(
      inspected.compilation.program.tokens.some((token) =>
        token.codePoints.includes("U+05B4"),
      ),
    ).toBe(true);
    expect(inspected).not.toHaveProperty("sandbox");
    expect(inspected).not.toHaveProperty("machine");
  });

  it.each([
    "יִ $r1, 5",
    "יּ",
    "א֣",
    "א $r1",
    "א💥",
    "א;ב",
    "xא",
    "א\u202eב",
    "א\u200bב",
  ])(
    "never silently projects unsupported source into Tree opcodes: %s",
    (source) => {
      expect(() => createIvritCodeMachineRun(source)).toThrow();
      expect(() => executeLab({ ...tree, source })).toThrow();
    },
  );

  it("accepts machine comments without executing text inside them", () => {
    const result = createIvritCodeMachineRun("אור # יִ $r1, 5\nשלום");
    expect(result.opcodeStream).toBe("אורשלומ");
  });

  it.each([
    "יִ $r2, 5",
    "י $r1, 5",
    "יִ $r1, 5garbage",
    "יִ $r1, 1.5",
    "יִ $r1, NaN",
    "יִ $r1, 5; א",
    "יִ $r1, 5 יִ $r1, 2",
    "א",
    "יִ $r1, 5\u05c3",
    "יִ $r1, 9007199254740992",
  ])("rejects unsupported integer syntax or inexact values: %s", (source) => {
    expect(() => executeLab({ ...integer, source })).toThrow();
  });

  it("bounds intermediate arithmetic and both instruction budgets", () => {
    expect(() =>
      executeLab({
        ...integer,
        source: "יִ $r1, 9007199254740991",
        initialR1: 1,
      }),
    ).toThrow(/exact integer/);
    expect(() =>
      executeLab({
        ...integer,
        source: Array(129).fill("יִ $r1, 1").join("\n"),
      }),
    ).toThrow(/128/);
    expect(() => executeLab({ ...tree, source: "א".repeat(1025) })).toThrow(
      /1,024/,
    );
    expect(() => inspectLab({ ...tree, source: "א".repeat(4097) })).toThrow(
      /4,096/,
    );
  });

  it.each([NaN, Infinity, -1, 22, 1.5])("rejects invalid seeds: %s", (seed) => {
    expect(() => inspectLab({ ...tree, seed })).toThrow(/seed/);
  });

  it.each([
    "?source=א&profile=unknown",
    "?source=א&seed=22",
    "?source=יִ+$r1,5&profile=tree",
    "?source=",
    "?source=א&r1=Infinity",
  ])(
    "ignores invalid study links without falling through to execution: %s",
    (query) => {
      expect(
        readLabPermalink(`https://quantumetzchaim.com/ivritcode.html${query}`),
      ).toBeUndefined();
    },
  );
});
