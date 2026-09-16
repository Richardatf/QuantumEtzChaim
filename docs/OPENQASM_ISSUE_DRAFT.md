# Draft external OpenQASM discussion

**Suggested title**

`QEC / IvritCode → OpenQASM 3 projection: request for interoperability review`

**Suggested body**

Quantum Etz Chaim (QEC) is an independent experimental computing architecture that uses OpenQASM 3 as an interoperability boundary. We are looking for critical technical review of the projection and its validation evidence, not endorsement or a specification change.

Repository: https://github.com/Richardatf/QuantumEtzChaim

Five-minute integration guide: https://github.com/Richardatf/QuantumEtzChaim/blob/main/OPENQASM_INTEGRATION.md

## What exists today

QEC accepts IvritCode programs whose executable alphabet is the 22 Hebrew letters. A deterministic projection maps each normalized executable instruction to an operation from the OpenQASM 3 standard gate library and allocates operands deterministically.

Two profiles are committed:

- `ivritcode-openqasm-0.1` — frozen QEC profile emitting `OPENQASM 3.0;`
- `ivritcode-openqasm-0.2` — experimental semantic-hold companion emitting `OPENQASM 3.1;`

The 0.2 profile intentionally preserves the 0.1 gate mapping and operand semantics so that version/toolchain behavior can be reviewed separately from changes to the mapping itself.

The projection is emit-only inside QEC. We do not claim that QEC's symbolic runtime is quantum hardware, that successful parsing proves hardware-backend compatibility, or that OpenQASM/Qiskit endorses this project.

## Minimal example

IvritCode:

```text
אור
```

Profile 0.1 emits:

```qasm
OPENQASM 3.0;
include "stdgates.inc";

// QEC projection profile: ivritcode-openqasm-0.1
// IvritCode source: אור
qubit[3] q;
bit[3] result;

p(0) q[0];
s q[1];
cry(pi/2) q[2], q[0];

result = measure q;
```

Exact fixture:

https://github.com/Richardatf/QuantumEtzChaim/blob/main/tests/fixtures/openqasm/or-seed-09.qasm

## Current validation evidence

The current canonical corpus is deliberately small: `אור` (seed 9) and `שלום` → `שלומ` (seed 17).

The committed evidence records PASS for the exact fixtures with:

- `openqasm3 1.0.1` reference parser
- `qiskit-qasm3-import 0.6.0` with `qiskit 2.5.0`
- Qiskit statevector execution of the unitary portion after final measurement removal
- Qiskit `openqasm3_parser` Rust front end pinned at `3eac9970f37baf6d030a3a185b9421cca3cf0a59`

Evidence and reproduction path:

- https://github.com/Richardatf/QuantumEtzChaim/blob/main/docs/OPENQASM_VALIDATION.md
- https://github.com/Richardatf/QuantumEtzChaim/blob/main/docs/OPENQASM_30_31_MATRIX.md
- https://github.com/Richardatf/QuantumEtzChaim/blob/main/evidence/openqasm-validation-matrix-v0.2.json
- https://github.com/Richardatf/QuantumEtzChaim/blob/main/scripts/validate-openqasm.py

This is compatibility evidence for the committed corpus only. It is not certification and does not establish quantum-hardware execution.

## Questions for OpenQASM implementers

We would particularly value review of these points:

1. Are these emitted programs idiomatic and portable OpenQASM, or merely parseable by the validators we selected?
2. Is maintaining a frozen 3.0 profile alongside an experimental 3.1 profile a sensible compatibility strategy?
3. Are any of the 22 gate choices, arities, fixed parameters, or deterministic operand-allocation rules especially problematic for OpenQASM tooling or future lowering?
4. Which additional parser, simulator, compiler, or backend-facing toolchain would provide the most meaningful independent next validation target?
5. We bind emitted OpenQASM source, SHA-256 hashes, validator versions, diagnostics, symbolic trace information, and related evidence into a QEC Run Passport. Is that a useful reproducibility pattern? What provenance fields would you add or remove?
6. What minimum evidence would you expect before an external project describes a projection as `parser-validated`, `simulator-validated`, or `backend-tested`?

## What we are not proposing

We are not currently asking for a change to the OpenQASM language specification. If review exposes a genuine language or low-level tooling gap, we would prefer to separate that into a later discussion and follow the normal OpenQASM proposal process.

Please feel free to break the examples, point out non-idiomatic choices, or suggest a better interoperability test. Exact failures and disagreements between toolchains are especially useful to us.

Author/contact: Richard Lee (`@Richardatf`)
