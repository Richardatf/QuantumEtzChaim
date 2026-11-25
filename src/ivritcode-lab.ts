import { compileIvrit, type Compilation } from "@qec/ivrit-compiler";
import { createManifest, runQEC, type QECRun } from "@qec/core";
import { contentHash, type ExecutionManifest } from "@qec/spec";
import {
  createIvritCodeMachineRun,
  type IvritCodeMachineRun,
} from "./ivritcode-bridge.js";

export type LabProfile = "tree" | "integer";
export interface LabInput {
  source: string;
  profile: LabProfile;
  seed: number;
  initialR1: number;
}
export interface LabInspection {
  input: LabInput;
  compilation: Compilation;
  normalizedSource: string;
  manifest: ExecutionManifest;
}
export type LabRun =
  | { profile: "tree"; inspection: LabInspection; machine: IvritCodeMachineRun }
  | { profile: "integer"; inspection: LabInspection; sandbox: QECRun };

export const LAB_EXAMPLES: readonly {
  id: string;
  title: string;
  source: string;
  profile: LabProfile;
  lesson: string;
}[] = [
  {
    id: "light",
    title: "Follow light",
    source: "אור",
    profile: "tree",
    lesson:
      "Read Aleph, Vav, Resh from right to left. Each letter selects one project-defined path. Step through all three to reach the observed output.",
  },
  {
    id: "shalom",
    title: "Recognize final forms",
    source: "שלום",
    profile: "tree",
    lesson:
      "The last letter is final Mem (ם). Its opcode is Mem (מ). The compiler keeps your original source while the Tree uses the canonical letter.",
  },
  {
    id: "truth",
    title: "Compare another route",
    source: "אמת",
    profile: "tree",
    lesson:
      "Aleph, Mem, Tav take different routes from אור. Run each with the same seed and compare the paths, register changes, and final checksum.",
  },
  {
    id: "integer",
    title: "Add with a vowel mark",
    source: "יִ $r1, 5",
    profile: "integer",
    lesson:
      "Yod is ADD in the language specification. Hiriq selects integer mode. In this implemented subset, r1 begins at your chosen value and increases by five.",
  },
  {
    id: "sequence",
    title: "Build a short program",
    source: "# Add five, then subtract two\nיִ $r1, 5\nיִ $r1, -2",
    profile: "integer",
    lesson:
      "One instruction per line makes a sequence. A # starts a comment. The local integer sandbox executes both additions and records verification and policy stages.",
  },
];

export function inspectLab(input: LabInput): LabInspection {
  if (input.profile !== "tree" && input.profile !== "integer")
    throw new SyntaxError("Choose a supported execution profile.");
  if (!input.source.trim())
    throw new SyntaxError("Enter a program or load a lesson first.");
  if (input.source.length > 4096)
    throw new RangeError("Source is limited to 4,096 characters.");
  if (!Number.isInteger(input.seed) || input.seed < 0 || input.seed > 21)
    throw new RangeError("Choose a seed from 0 to 21.");
  if (
    !Number.isSafeInteger(input.initialR1) ||
    Math.abs(input.initialR1) > 1_000_000_000
  )
    throw new RangeError(
      "Initial r1 must be a whole number between −1,000,000,000 and 1,000,000,000.",
    );
  const compilation = compileIvrit(input.source);
  if (compilation.diagnostics.length)
    throw new SyntaxError(compilation.diagnostics.join("; "));
  const lines = input.source
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*/, "").trim())
    .filter(Boolean);
  if (input.profile === "tree") {
    if (!lines.every((line) => /^[\u05D0-\u05EA\s]+$/u.test(line)))
      throw new SyntaxError(
        "Tree simulation accepts unpointed Hebrew letters and # comments. Choose Integer ADD for יִ $r1, 5.",
      );
    if (!compilation.ir.length || compilation.ir.length > 1024)
      throw new RangeError("Tree simulation requires 1 to 1,024 letters.");
  } else {
    if (!lines.every((line) => /^יִ\s+\$r1\s*,\s*-?\d+$/u.test(line)))
      throw new SyntaxError(
        "Integer ADD supports one יִ $r1, whole-number instruction per line. Other registers, marks, and operations are not implemented in this profile.",
      );
    if (
      !compilation.ir.length ||
      compilation.ir.length > 128 ||
      compilation.ir.length !== lines.length ||
      compilation.ir.some(
        (item) => item.operation !== "add_int" || item.register !== "r1",
      )
    )
      throw new SyntaxError(
        "Integer ADD requires 1 to 128 complete r1 addition instructions.",
      );
    let value = input.initialR1;
    for (const instruction of compilation.ir) {
      if (
        !Number.isSafeInteger(instruction.value) ||
        !Number.isSafeInteger(value + instruction.value!)
      )
        throw new RangeError(
          "Integer values and intermediate results must remain within JavaScript’s exact integer range.",
        );
      value += instruction.value!;
    }
  }
  const base = createManifest(input.source, {
    deterministicSeed: input.seed,
    purpose:
      input.profile === "tree"
        ? "IvritCode symbolic Tree study"
        : "IvritCode integer ADD study",
  });
  const { contentHash: _previousHash, ...manifestBody } = {
    ...base,
    declaredInputs: input.profile === "tree" ? ["seed"] : ["r1"],
    declaredOutputs:
      input.profile === "tree" ? ["registers", "manifestation"] : ["r1"],
    resourceBudget: {
      ...base.resourceBudget,
      maxSteps: input.profile === "tree" ? 1024 : 128,
    },
  };
  return {
    input: { ...input },
    compilation,
    normalizedSource: input.source.normalize("NFC"),
    manifest: { ...manifestBody, contentHash: contentHash(manifestBody) },
  };
}

// Explicit caller action is the only entry to execution. Inspection and link
// restoration are side-effect free and never run a program.
export function executeLab(input: LabInput): LabRun {
  const inspection = inspectLab(input);
  return input.profile === "tree"
    ? {
        profile: "tree",
        inspection,
        machine: createIvritCodeMachineRun(input.source, input.seed),
      }
    : {
        profile: "integer",
        inspection,
        sandbox: runQEC(
          input.source,
          { r1: input.initialR1 },
          inspection.manifest,
        ),
      };
}

export function labPermalink(base: string, input: LabInput): string {
  inspectLab(input);
  const url = new URL(base);
  url.search = "";
  url.hash = "";
  url.searchParams.set("source", input.source);
  url.searchParams.set("profile", input.profile);
  url.searchParams.set("seed", String(input.seed));
  url.searchParams.set("r1", String(input.initialR1));
  return url.href;
}

export function readLabPermalink(value: string): LabInput | undefined {
  try {
    const params = new URL(value).searchParams;
    if (!params.has("source")) return undefined;
    const profile = params.get("profile") ?? "tree";
    if (profile !== "tree" && profile !== "integer") return undefined;
    const input: LabInput = {
      source: params.get("source")!,
      profile,
      seed: Number(params.get("seed") ?? 9),
      initialR1: Number(params.get("r1") ?? 0),
    };
    inspectLab(input);
    return input;
  } catch {
    return undefined;
  }
}
