const FINAL_FORMS: Readonly<Record<string, string>> = Object.freeze({
  ך: "כ",
  ם: "מ",
  ן: "נ",
  ף: "פ",
  ץ: "צ",
});

export type OpenQasmGate = Readonly<{
  letter: string;
  operation: string;
  label: string;
  arity: 1 | 2 | 3;
}>;

export const IVRIT_OPENQASM_PROFILE = "ivritcode-openqasm-0.1";

export const IVRIT_OPENQASM_GATES: readonly OpenQasmGate[] = Object.freeze([
  { letter: "א", operation: "p(0)", label: "Identity phase", arity: 1 },
  { letter: "ב", operation: "x", label: "Pauli X", arity: 1 },
  { letter: "ג", operation: "y", label: "Pauli Y", arity: 1 },
  { letter: "ד", operation: "z", label: "Pauli Z", arity: 1 },
  { letter: "ה", operation: "h", label: "Hadamard", arity: 1 },
  { letter: "ו", operation: "s", label: "S phase", arity: 1 },
  { letter: "ז", operation: "sdg", label: "S adjoint", arity: 1 },
  { letter: "ח", operation: "t", label: "T phase", arity: 1 },
  { letter: "ט", operation: "tdg", label: "T adjoint", arity: 1 },
  { letter: "י", operation: "sx", label: "Square-root X", arity: 1 },
  { letter: "כ", operation: "rx(pi/2)", label: "X rotation", arity: 1 },
  { letter: "ל", operation: "ry(pi/2)", label: "Y rotation", arity: 1 },
  { letter: "מ", operation: "rz(pi/2)", label: "Z rotation", arity: 1 },
  { letter: "נ", operation: "p(pi/4)", label: "Phase rotation", arity: 1 },
  { letter: "ס", operation: "cx", label: "Controlled X", arity: 2 },
  { letter: "ע", operation: "cy", label: "Controlled Y", arity: 2 },
  { letter: "פ", operation: "cz", label: "Controlled Z", arity: 2 },
  { letter: "צ", operation: "cp(pi/2)", label: "Controlled phase", arity: 2 },
  {
    letter: "ק",
    operation: "crx(pi/2)",
    label: "Controlled X rotation",
    arity: 2,
  },
  {
    letter: "ר",
    operation: "cry(pi/2)",
    label: "Controlled Y rotation",
    arity: 2,
  },
  { letter: "ש", operation: "swap", label: "Swap", arity: 2 },
  { letter: "ת", operation: "ccx", label: "Toffoli", arity: 3 },
]);

const gateByLetter = new Map(
  IVRIT_OPENQASM_GATES.map((gate) => [gate.letter, gate]),
);

export function normalizeIvritSource(source: string): string {
  return [...source.normalize("NFD")]
    .filter((character) => !/[\u0591-\u05c7]/u.test(character))
    .map((character) => FINAL_FORMS[character] ?? character)
    .join("")
    .normalize("NFC");
}

function operands(index: number, qubitCount: number, arity: 1 | 2 | 3) {
  const available = Array.from(
    { length: arity },
    (_, offset) => `q[${(index + offset) % qubitCount}]`,
  );
  return available.join(", ");
}

export function compileIvritToOpenQasm(source: string, qubitCount = 3): string {
  if (!Number.isInteger(qubitCount) || qubitCount < 3 || qubitCount > 32) {
    throw new RangeError("OpenQASM target requires 3 to 32 qubits");
  }
  const normalized = normalizeIvritSource(source);
  if (normalized.length === 0 || normalized.length > 1024) {
    throw new SyntaxError("Enter 1 to 1,024 Hebrew instructions");
  }
  const gates = [...normalized].map((letter) => {
    const gate = gateByLetter.get(letter);
    if (!gate) {
      throw new SyntaxError(`Unsupported IvritCode instruction: ${letter}`);
    }
    return gate;
  });

  const body = gates.map(
    (gate, index) =>
      `// ${gate.letter} / ${gate.label}\n${gate.operation} ${operands(index, qubitCount, gate.arity)};`,
  );

  return [
    "OPENQASM 3.0;",
    'include "stdgates.inc";',
    "",
    `// QEC projection profile: ${IVRIT_OPENQASM_PROFILE}`,
    `// IvritCode source: ${normalized}`,
    `qubit[${qubitCount}] q;`,
    `bit[${qubitCount}] result;`,
    "",
    ...body,
    "",
    "result = measure q;",
  ].join("\n");
}
