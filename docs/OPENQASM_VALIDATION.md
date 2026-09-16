# OpenQASM external validation evidence

Profile: `qec-openqasm-validation-0.1`

Captured: `2026-09-16T20:06:13+00:00`

Overall result: **PASS**

This report validates the exact canonical OpenQASM files emitted for the QEC evidence programs. It is external compatibility evidence, not an OpenQASM certification or endorsement.

## Pinned validators

- OpenQASM Python reference parser: `openqasm3 1.0.1`
- Qiskit importer: `qiskit-qasm3-import 0.6.0` with `qiskit 2.5.0`
- Qiskit Rust OpenQASM 3 front end: `Qiskit/openqasm3_parser@3eac9970f37baf6d030a3a185b9421cca3cf0a59`

## Canonical programs

| Program         | Seed | QASM SHA-256                                                       | Reference parser | Qiskit import | Statevector | Rust front end |
| --------------- | ---: | ------------------------------------------------------------------ | ---------------- | ------------- | ----------- | -------------- |
| `אור` (`אור`)   |    9 | `e0dda19344f486191a5520968cabdc844e30bcb2cbd786d76fd17d3689fa8101` | PASS             | PASS          | PASS        | PASS           |
| `שלום` (`שלומ`) |   17 | `0fbef195017714ce57f05053c73f4fc9ed916d22fa8f97d0929275a9b3355c6e` | PASS             | PASS          | PASS        | PASS           |

## Interpretation

A PASS means the committed OpenQASM fixture parsed with the reference parser, imported into Qiskit, executed through Qiskit's statevector machinery after removing final measurement, and parsed without syntax errors by the independent Rust front end. The evidence remains intentionally scoped to the canonical corpus above; other IvritCode programs are not automatically covered by this report.

The machine-readable source of record is [`../evidence/openqasm-validation-v0.1.json`](../evidence/openqasm-validation-v0.1.json).
