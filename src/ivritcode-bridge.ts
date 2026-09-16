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
  const compilation = compileIvrit(source);
  if (
    compilation.diagnostics.length > 0 ||
    compilation.program.validationStatus !== "valid"
  ) {
    const detail = compilation.diagnostics.join("; ") || "invalid program";
    throw new SyntaxError(`IvritCode compilation failed: ${detail}`);
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
