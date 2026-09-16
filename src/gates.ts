import { HEBREW_LETTERS, type HebrewLetter } from "@ivritcode/core";
import gateRules from "../specifications/qec-gate-rules-v0.1.json";

export const GATE_RULE_PROFILE = "qec-gate-rules-0.1" as const;

export type GateRuleStatus = "approved" | "reserved" | "rejected";
export type GateComposition = "continuation" | "crossing" | "reinforcement";

export interface GateDirectionRule {
  readonly from: HebrewLetter;
  readonly to: HebrewLetter;
  readonly status: GateRuleStatus;
  readonly executable: boolean;
  readonly composition: GateComposition | null;
  readonly description: string;
}

export interface CanonicalGateDefinition {
  readonly profile: typeof GATE_RULE_PROFILE;
  readonly id: string;
  readonly pair: string;
  readonly left: HebrewLetter;
  readonly right: HebrewLetter;
  readonly status: GateRuleStatus;
  readonly technicalBasis: string;
  readonly directions: readonly GateDirectionRule[];
}

export interface GateInvocationResolution {
  readonly profile: typeof GATE_RULE_PROFILE;
  readonly kind: "canonical-gate" | "self-transition";
  readonly gateId: string | null;
  readonly pair: string;
  readonly direction: string;
  readonly status: GateRuleStatus | "self-transition";
  readonly executable: boolean;
  readonly composition: GateComposition | null;
  readonly description: string;
}

const alphabetIndex = new Map(
  HEBREW_LETTERS.map((letter, index) => [letter, index]),
);
const explicitRules = new Map(
  gateRules.rules.map((rule) => [rule.id, rule] as const),
);
const defaultStatus = gateRules.defaultRule.status as GateRuleStatus;

function gateId(leftIndex: number, rightIndex: number): string {
  return `gate-${leftIndex + 1}-${rightIndex + 1}`;
}

function validateRuleProfile(): void {
  if (gateRules.id !== GATE_RULE_PROFILE) {
    throw new Error("Gate rule profile version does not match the runtime.");
  }
  if (gateRules.alphabet !== HEBREW_LETTERS.join("")) {
    throw new Error("Gate rule profile alphabet is not canonical.");
  }
  if (gateRules.pairing.expectedCount !== 231) {
    throw new Error("Gate rule profile must declare exactly 231 identities.");
  }
  if (explicitRules.size !== gateRules.rules.length) {
    throw new Error("Gate rule profile contains a duplicate rule ID.");
  }

  gateRules.rules.forEach((rule) => {
    const [left, right] = rule.letters as [HebrewLetter, HebrewLetter];
    const leftIndex = alphabetIndex.get(left);
    const rightIndex = alphabetIndex.get(right);
    if (
      leftIndex === undefined ||
      rightIndex === undefined ||
      leftIndex >= rightIndex ||
      rule.id !== gateId(leftIndex, rightIndex) ||
      rule.pair !== `${left}־${right}`
    ) {
      throw new Error(
        `Gate rule ${rule.id} has an invalid canonical identity.`,
      );
    }
    const expectedDirections = new Set([
      `${left}→${right}`,
      `${right}→${left}`,
    ]);
    const actualDirections = new Set(
      rule.directions.map((direction) => `${direction.from}→${direction.to}`),
    );
    if (
      actualDirections.size !== 2 ||
      [...actualDirections].some(
        (direction) => !expectedDirections.has(direction),
      )
    ) {
      throw new Error(`Gate rule ${rule.id} must define both directions once.`);
    }
    if (
      (rule.status === "approved") !==
      rule.directions.some((direction) => direction.status === "approved")
    ) {
      throw new Error(
        `Gate rule ${rule.id} status must reflect its approved directions.`,
      );
    }
    rule.directions.forEach((direction) => {
      const approved = direction.status === "approved";
      if (
        direction.executable !== approved ||
        (approved
          ? direction.composition === null
          : direction.composition !== null)
      ) {
        throw new Error(
          `Gate direction ${direction.from}→${direction.to} has inconsistent approval fields.`,
        );
      }
    });
  });
}

validateRuleProfile();

export function buildCanonicalGateRegistry(): CanonicalGateDefinition[] {
  const registry: CanonicalGateDefinition[] = [];
  for (let leftIndex = 0; leftIndex < HEBREW_LETTERS.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < HEBREW_LETTERS.length;
      rightIndex += 1
    ) {
      const left = HEBREW_LETTERS[leftIndex]!;
      const right = HEBREW_LETTERS[rightIndex]!;
      const id = gateId(leftIndex, rightIndex);
      const explicit = explicitRules.get(id);
      registry.push({
        profile: GATE_RULE_PROFILE,
        id,
        pair: `${left}־${right}`,
        left,
        right,
        status:
          (explicit?.status as GateRuleStatus | undefined) ?? defaultStatus,
        technicalBasis:
          explicit?.technicalBasis ?? gateRules.defaultRule.reason,
        directions:
          explicit?.directions.map((direction) => ({
            ...direction,
            from: direction.from as HebrewLetter,
            to: direction.to as HebrewLetter,
            status: direction.status as GateRuleStatus,
            composition: direction.composition as GateComposition | null,
          })) ?? [],
      });
    }
  }
  return registry;
}

export const GATE_REGISTRY = Object.freeze(buildCanonicalGateRegistry());
const gateById = new Map(GATE_REGISTRY.map((gate) => [gate.id, gate]));

export function resolveGateInvocation(
  from: HebrewLetter,
  to: HebrewLetter,
): GateInvocationResolution {
  if (from === to) {
    return {
      profile: GATE_RULE_PROFILE,
      kind: "self-transition",
      gateId: null,
      pair: `${from}־${to}`,
      direction: `${from}→${to}`,
      status: "self-transition",
      executable: true,
      composition: "reinforcement",
      description:
        "Repeated-letter reinforcement is a self-transition outside the 231-Gate registry.",
    };
  }

  const fromIndex = alphabetIndex.get(from);
  const toIndex = alphabetIndex.get(to);
  if (fromIndex === undefined || toIndex === undefined) {
    throw new RangeError(
      "Gate invocation requires two canonical Hebrew letters.",
    );
  }
  const leftIndex = Math.min(fromIndex, toIndex);
  const rightIndex = Math.max(fromIndex, toIndex);
  const definition = gateById.get(gateId(leftIndex, rightIndex));
  if (!definition) throw new Error("Canonical Gate registry is incomplete.");
  const direction = definition.directions.find(
    (candidate) => candidate.from === from && candidate.to === to,
  );
  if (direction) {
    return {
      profile: GATE_RULE_PROFILE,
      kind: "canonical-gate",
      gateId: definition.id,
      pair: definition.pair,
      direction: `${from}→${to}`,
      status: direction.status,
      executable: direction.executable,
      composition: direction.composition,
      description: direction.description,
    };
  }
  return {
    profile: GATE_RULE_PROFILE,
    kind: "canonical-gate",
    gateId: definition.id,
    pair: definition.pair,
    direction: `${from}→${to}`,
    status: defaultStatus,
    executable: gateRules.defaultRule.executable,
    composition: null,
    description: gateRules.defaultRule.reason,
  };
}
