import { compileIvrit, type Compilation } from "@qec/ivrit-compiler";
import { runProgram, type ProgramExecutionResult } from "./machine.js";
import { createRunPassport, type MachineRunPassport } from "./passport.js";

export interface IvritCodeMachineRun {
  readonly compilation: Compilation;
  readonly opcodeStream: string;
  readonly execution: ProgramExecutionResult;
  readonly passport: MachineRunPassport;
}

/**
 * Cross the published IvritCode/QEC package boundary before entering the
 * machine workflow. The compiler and the deterministic machine runtime must
 * agree on the exact normalized opcode stream or the bridge fails closed.
 */
export function createIvritCodeMachineRun(
  source: string,
  seed = 9,
): IvritCodeMachineRun {
  if (source.length > 4096) {
    throw new RangeError("IvritCode source exceeds the 4,096-character limit.");
  }
  const compilation = compileIvrit(source);
  if (
    compilation.diagnostics.length > 0 ||
    compilation.program.validationStatus !== "valid"
  ) {
    const detail = compilation.diagnostics.join("; ") || "invalid program";
    throw new SyntaxError(`IvritCode compilation failed: ${detail}`);
  }

  // This adapter executes the symbolic register profile only. Never discard
  // operands, modifiers, controls, or unrecognized text while extracting letters.
  const executableSource = source.replace(/#[^\n]*/g, "");
  if (
    !/^[\u05D0-\u05EA\s]*$/u.test(executableSource) ||
    compilation.ir.some((item) => item.operation !== "legacy_opcode") ||
    compilation.program.instructions.some(
      (item) =>
        item.modifier.name !== "direct" ||
        item.operands.length > 0 ||
        item.controlMarks.length > 0,
    )
  ) {
    throw new SyntaxError(
      "The Tree machine accepts unpointed Hebrew letters and # comments only. Use the IvritCode workbench for typed arithmetic; operands and marks cannot be discarded.",
    );
  }

  const opcodeStream = compilation.program.instructions
    .map((instruction) => instruction.opcode)
    .join("");
  if (opcodeStream.length === 0) {
    throw new SyntaxError("IvritCode compilation produced no machine opcodes.");
  }

  const execution = runProgram(opcodeStream, seed);
  if (execution.program !== opcodeStream) {
    throw new Error(
      `IvritCode/QEC opcode divergence: compiler=${opcodeStream} runtime=${execution.program}`,
    );
  }

  return {
    compilation,
    opcodeStream,
    execution,
    passport: createRunPassport(execution),
  };
}
