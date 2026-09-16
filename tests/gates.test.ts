import { describe, expect, it } from "vitest";
import {
  GATE_REGISTRY,
  GATE_RULE_PROFILE,
  buildCanonicalGateRegistry,
  resolveGateInvocation,
} from "../src/gates.js";
import { HEBREW_ALPHABET, runProgram } from "../src/machine.js";

describe("qec-gate-rules-0.1", () => {
  it("builds all 231 canonical unordered identities exactly once", () => {
    expect(GATE_REGISTRY).toHaveLength(231);
    expect(buildCanonicalGateRegistry()).toEqual(GATE_REGISTRY);
    expect(new Set(GATE_REGISTRY.map((gate) => gate.id))).toHaveLength(231);
    expect(new Set(GATE_REGISTRY.map((gate) => gate.pair))).toHaveLength(231);
    expect(
      GATE_REGISTRY.every(
        (gate) =>
          gate.profile === GATE_RULE_PROFILE && gate.left !== gate.right,
      ),
    ).toBe(true);
  });

  it("resolves all 462 directions and approves only the reference pairings", () => {
    const resolutions = HEBREW_ALPHABET.flatMap((from) =>
      HEBREW_ALPHABET.filter((to) => to !== from).map((to) =>
        resolveGateInvocation(from, to),
      ),
    );
    expect(resolutions).toHaveLength(462);
    expect(resolutions.filter((rule) => rule.status === "approved")).toEqual([
      expect.objectContaining({
        gateId: "gate-1-6",
        direction: "א→ו",
        executable: true,
        composition: "crossing",
      }),
      expect.objectContaining({
        gateId: "gate-6-20",
        direction: "ו→ר",
        executable: true,
        composition: "continuation",
      }),
    ]);
    expect(
      resolutions
        .filter((rule) => rule.status !== "approved")
        .every((rule) => !rule.executable && rule.status === "reserved"),
    ).toBe(true);
  });

  it("keeps repeated letters outside the 231-Gate registry", () => {
    HEBREW_ALPHABET.forEach((letter) => {
      expect(resolveGateInvocation(letter, letter)).toEqual(
        expect.objectContaining({
          kind: "self-transition",
          gateId: null,
          direction: `${letter}→${letter}`,
          status: "self-transition",
          executable: true,
          composition: "reinforcement",
        }),
      );
    });
  });

  it("binds approved אור invocations to observed runtime topology", () => {
    const gates = runProgram("אור", 9).gates;
    expect(gates).toHaveLength(2);
    expect(gates).toEqual([
      expect.objectContaining({
        id: "א־ו",
        canonicalGateId: "gate-1-6",
        direction: "א→ו",
        ruleStatus: "approved",
        executable: true,
        composition: "crossing",
      }),
      expect.objectContaining({
        id: "ו־ר",
        canonicalGateId: "gate-6-20",
        direction: "ו→ר",
        ruleStatus: "approved",
        executable: true,
        composition: "continuation",
      }),
    ]);
  });

  it("reports reserved and self-transition invocations without activating them", () => {
    expect(runProgram("אב", 9).gates[0]).toEqual(
      expect.objectContaining({
        canonicalGateId: "gate-1-2",
        direction: "א→ב",
        ruleStatus: "reserved",
        executable: false,
      }),
    );
    expect(runProgram("אא", 9).gates[0]).toEqual(
      expect.objectContaining({
        canonicalGateId: null,
        direction: "א→א",
        ruleStatus: "self-transition",
        executable: true,
      }),
    );
  });
});
