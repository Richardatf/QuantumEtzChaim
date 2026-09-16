# OpenQASM 3.0 / 3.1 compatibility matrix

Profile: `qec-openqasm-validation-matrix-0.2`

Captured: `2026-09-16T20:33:27+00:00`

Overall result: **PASS**

QEC profile 0.1 remains the frozen Run Passport projection. Profile 0.2 is an experimental OpenQASM 3.1 semantic hold: the gate mapping and operand semantics are unchanged so this matrix isolates version/toolchain behavior.

## Pinned validators

- OpenQASM Python reference parser: `openqasm3 1.0.1`
- Qiskit importer: `qiskit-qasm3-import 0.6.0` with `qiskit 2.5.0`
- Qiskit Rust OpenQASM 3 front end: `Qiskit/openqasm3_parser@3eac9970f37baf6d030a3a185b9421cca3cf0a59`

## Matrix

| Profile                  | Target       | Program | Seed | Reference parser | Qiskit import | Statevector | Rust front end |
| ------------------------ | ------------ | ------- | ---: | ---------------- | ------------- | ----------- | -------------- |
| `ivritcode-openqasm-0.1` | OpenQASM 3.0 | `אור`   |    9 | PASS             | PASS          | PASS        | PASS           |
| `ivritcode-openqasm-0.1` | OpenQASM 3.0 | `שלום`  |   17 | PASS             | PASS          | PASS        | PASS           |
| `ivritcode-openqasm-0.2` | OpenQASM 3.1 | `אור`   |    9 | PASS             | PASS          | PASS        | PASS           |
| `ivritcode-openqasm-0.2` | OpenQASM 3.1 | `שלום`  |   17 | PASS             | PASS          | PASS        | PASS           |

## Interpretation

A PASS is compatibility evidence for the exact committed fixtures and pinned validators only. It is not OpenQASM certification, endorsement, or quantum-hardware execution. A 3.1 failure does not invalidate frozen profile 0.1; it identifies a toolchain/version boundary for review.

Machine-readable evidence: [`../evidence/openqasm-validation-matrix-v0.2.json`](../evidence/openqasm-validation-matrix-v0.2.json).
