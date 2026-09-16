import { describe, expect, it } from "vitest";
import {
  GATE_EVIDENCE_PROGRAMS,
  GATE_REGISTRY,
  GATE_RULE_PROFILE,
  buildCanonicalGateRegistry,
  resolveGateInvocation,
} from "../src/gates.js";
import { createIvritCodeMachineRun } from "../src/ivritcode-bridge.js";
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

  it("resolves all 462 directions and approves only evidence-backed pairings", () => {
    const resolutions = HEBREW_ALPHABET.flatMap((from) =>
      HEBREW_ALPHABET.filter((to) => to !== from).map((to) =>
        resolveGateInvocation(from, to),
      ),
    );
    expect(resolutions).toHaveLength(462);
    const approved = resolutions.filter((rule) => rule.status === "approved");
    expect(approved).toHaveLength(22);
    expect(approved).toEqual(
      expect.arrayContaining([
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
        expect.objectContaining({
          gateId: "gate-6-12",
          direction: "ל→ו",
          executable: true,
          composition: "crossing",
        }),
        expect.objectContaining({
          gateId: "gate-6-13",
          direction: "ו→מ",
          executable: true,
          composition: "crossing",
        }),
        expect.objectContaining({
          gateId: "gate-12-21",
          direction: "ש→ל",
          executable: true,
          composition: "continuation",
        }),
      ]),
    );
    expect(
      resolutions
        .filter((rule) => rule.status !== "approved")
        .every((rule) => !rule.executable && rule.status === "reserved"),
    ).toBe(true);
    expect(
      resolutions.filter((rule) => rule.status === "reserved"),
    ).toHaveLength(440);
  });

  it("replays every approved direction from its compiler-verified evidence", () => {
    const evidenceById = new Map(
      GATE_EVIDENCE_PROGRAMS.map((program) => [program.id, program]),
    );
    const approvedDirections = GATE_REGISTRY.flatMap((gate) =>
      gate.directions
        .filter((direction) => direction.status === "approved")
        .map((direction) => ({ gate, direction })),
    );

    expect(approvedDirections).toHaveLength(22);
    approvedDirections.forEach(({ gate, direction }) => {
      expect(direction.evidence).not.toBeNull();
      if (!direction.evidence) return;
      const evidence = evidenceById.get(direction.evidence.programId);
      expect(evidence).toBeDefined();
      if (!evidence) return;
      const verified = createIvritCodeMachineRun(
        evidence.source,
        evidence.seed,
      );
      expect(verified.opcodeStream).toBe(evidence.normalizedProgram);
      expect(verified.execution.gates[direction.evidence.gateIndex]).toEqual(
        expect.objectContaining({
          canonicalGateId: gate.id,
          direction: `${direction.from}→${direction.to}`,
          ruleStatus: "approved",
          executable: true,
          composition: direction.composition,
          ruleEvidence: direction.evidence,
        }),
      );
    });
  });

  it("tracks the expanded eight-program Gate evidence milestone", () => {
    expect(GATE_EVIDENCE_PROGRAMS).toHaveLength(8);
    expect(GATE_EVIDENCE_PROGRAMS.map((program) => program.id)).toEqual(
      expect.arrayContaining([
        "bereshit-seed-05",
        "emet-seed-07",
        "echad-seed-11",
        "chayim-seed-13",
        "daat-seed-19",
        "malkhut-seed-21",
      ]),
    );
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

  it("binds the approved שלום bridge invocations to observed topology", () => {
    expect(runProgram("שלום", 17).gates).toEqual([
      expect.objectContaining({
        canonicalGateId: "gate-12-21",
        direction: "ש→ל",
        ruleStatus: "approved",
        composition: "continuation",
      }),
      expect.objectContaining({
        canonicalGateId: "gate-6-12",
        direction: "ל→ו",
        ruleStatus: "approved",
        composition: "crossing",
      }),
      expect.objectContaining({
        canonicalGateId: "gate-6-13",
        direction: "ו→מ",
        ruleStatus: "approved",
        composition: "crossing",
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
