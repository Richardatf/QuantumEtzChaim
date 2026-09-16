# Quantum Etz Chaim × OpenQASM collaboration brief

**Status:** public technical invitation  
**QEC projection profile:** `ivritcode-openqasm-0.1`  
**QEC emitted language declaration:** `OPENQASM 3.0;`  
**OpenQASM ecosystem reference checked:** 2026-09-16; the public OpenQASM project identifies 3.1 as its current specification.

Quantum Etz Chaim (QEC) is an independent experimental computing architecture. It is not affiliated with, endorsed by, or part of the OpenQASM or Qiskit projects.

## What we built

QEC accepts IvritCode programs whose executable alphabet is the 22 Hebrew letters. The current deterministic projection profile maps each normalized IvritCode instruction to an OpenQASM 3 operation from `stdgates.inc`, allocates operands deterministically, emits a measurement result, and binds the emitted source into the QEC Run Passport alongside the symbolic execution trace and physical-panel state frames.

The OpenQASM projection is intentionally described as **emit-only** today. QEC does not claim that its symbolic runtime is quantum hardware, and the existence of an OpenQASM projection does not itself establish backend compatibility, physical quantum execution, or OpenQASM project endorsement.

The physical QEC-1/QEC-1P machine is a separate low-voltage demonstrator that manifests deterministic QEC state across addressable indicators. It is useful as a reproducible physical witness of the QEC execution path, not as a claim of quantum processing hardware.

## Why OpenQASM

OpenQASM is designed to sit between higher-level compiler/tooling layers and quantum execution systems. QEC therefore uses OpenQASM as the explicit interoperability boundary rather than inventing a private quantum-circuit interchange format.

Current QEC flow:

```text
IvritCode source
      ↓
Unicode normalization + final-form normalization
      ↓
QEC deterministic symbolic runtime
      ↓
Run Passport ───────────────┐
      ↓                     │
IvritCode→OpenQASM profile  │
      ↓                     │
OpenQASM 3 source           │
                            │
QEC-1P panel frames ────────┘
```

## What we are asking the OpenQASM community to help with

We would value critical technical review more than endorsement.

1. **Parser validation.** Run representative QEC output through recognized OpenQASM parsers and tell us exactly where our source is invalid, underspecified, obsolete, or unnecessarily restrictive.
2. **3.0 → 3.1 review.** Determine whether the current profile should remain a frozen OpenQASM 3.0 projection, move to 3.1, or publish parallel versioned profiles.
3. **Semantic review of the 22-instruction mapping.** The current map is deterministic, but determinism is not the same thing as a good quantum-language design. We want expert criticism of gate choice, arity, operand allocation, and composition.
4. **Backend experiments.** Help us establish a small, reproducible compatibility matrix across parsers, simulators, and hardware-facing toolchains without overstating what any successful parse proves.
5. **Control-flow and measurement evolution.** The current profile is intentionally simple. We want guidance on the most OpenQASM-native way to add classical control, parameterization, subroutines, timing, calibration-aware boundaries, and richer measurement behavior.
6. **Provenance design.** Review whether binding emitted OpenQASM source and validation evidence into the QEC Run Passport is a useful reproducibility pattern and what metadata should be added.
7. **Conformance evidence.** Help define the minimum evidence necessary before QEC should describe a projection profile as parser-validated, simulator-validated, or backend-tested.

## Current translation profile

The normative machine-readable profile is:

- `specifications/ivritcode-openqasm-v0.1.json`
- schema: `specifications/schemas/ivritcode-openqasm-v0.1.schema.json`
- implementation: `src/openqasm.ts`
- tests: `tests/openqasm.test.ts`

Current letter-to-operation map:

| Letter | Operation   | Arity |
| ------ | ----------- | ----: |
| א      | `p(0)`      |     1 |
| ב      | `x`         |     1 |
| ג      | `y`         |     1 |
| ד      | `z`         |     1 |
| ה      | `h`         |     1 |
| ו      | `s`         |     1 |
| ז      | `sdg`       |     1 |
| ח      | `t`         |     1 |
| ט      | `tdg`       |     1 |
| י      | `sx`        |     1 |
| כ      | `rx(pi/2)`  |     1 |
| ל      | `ry(pi/2)`  |     1 |
| מ      | `rz(pi/2)`  |     1 |
| נ      | `p(pi/4)`   |     1 |
| ס      | `cx`        |     2 |
| ע      | `cy`        |     2 |
| פ      | `cz`        |     2 |
| צ      | `cp(pi/2)`  |     2 |
| ק      | `crx(pi/2)` |     2 |
| ר      | `cry(pi/2)` |     2 |
| ש      | `swap`      |     2 |
| ת      | `ccx`       |     3 |

Hebrew final forms are normalized to their ordinary forms, and Hebrew combining marks in the U+0591–U+05C7 range are stripped before translation.

## Example

IvritCode source:

```text
אור
```

With the default three-qubit target, QEC currently emits:

```qasm
OPENQASM 3.0;
include "stdgates.inc";

// QEC projection profile: ivritcode-openqasm-0.1
// IvritCode source: אור
qubit[3] q;
bit[3] result;

// א / Identity phase
p(0) q[0];
// ו / S phase
s q[1];
// ר / Controlled Y rotation
cry(pi/2) q[2], q[0];

result = measure q;
```

## Evidence boundaries

QEC currently distinguishes these claims:

- **Deterministic projection:** implemented and tested inside the QEC repository.
- **Schema-bound projection profile:** implemented.
- **Run Passport binding:** implemented.
- **Independent parser acceptance:** PASS for the canonical `אור` seed 09 and `שלום` → `שלומ` seed 17 corpus with the OpenQASM Python reference parser and pinned independent Qiskit Rust front end.
- **Qiskit import + statevector execution:** PASS for the same canonical corpus; statevector evidence executes the unitary portion after removing final measurement.
- **Validation record:** exact tool versions, diagnostics, source SHA-256 values, and scope are captured in `evidence/openqasm-validation-v0.1.json` and summarized in `docs/OPENQASM_VALIDATION.md`.
- **Hardware-backend execution:** not implied by parser or statevector success and not yet claimed.
- **QEC-1P physical panel execution:** separate classical hardware-validation track.

This distinction is deliberate. We want every stronger compatibility statement to be backed by replayable evidence rather than by inference.

## Suggested next collaboration task

The first validation milestone is complete for `אור` and `שלום`. The next useful task is to broaden the corpus, review whether profile 0.1 should remain frozen at OpenQASM 3.0 or gain a parallel 3.1 profile, and add another simulator or backend-facing toolchain that is independent of the current parser path.

Please try to break the existing evidence too. If tools disagree, the disagreement should remain visible rather than being averaged into a compatibility claim.

## Where to inspect and respond

Repository: <https://github.com/Richardatf/QuantumEtzChaim>  
Open an issue: <https://github.com/Richardatf/QuantumEtzChaim/issues/new>  
OpenQASM project: <https://github.com/openqasm/openqasm>  
OpenQASM specification site: <https://openqasm.com/>

We are especially interested in review from people who work on OpenQASM parsing, compiler IRs, circuit lowering, simulator integration, backend interfaces, or reproducible execution records.

**The request is simple: inspect it, break it, tell us what is wrong, and help us make the bridge technically useful.**
