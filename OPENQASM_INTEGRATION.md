# QEC × OpenQASM integration

**Purpose:** reproducible interoperability review  
**Project:** Quantum Etz Chaim (QEC)  
**Repository:** https://github.com/Richardatf/QuantumEtzChaim  
**OpenQASM status checked:** 2026-09-16  

Quantum Etz Chaim is an independent experimental computing architecture. It is not affiliated with, endorsed by, or part of the OpenQASM or Qiskit projects.

This document is the shortest path for an OpenQASM maintainer, compiler engineer, or quantum-tooling developer to inspect the QEC interoperability boundary without needing to understand the broader QEC architecture first.

## What QEC currently does

QEC accepts IvritCode source, normalizes its Hebrew executable alphabet, and deterministically projects each executable instruction into an OpenQASM 3 circuit operation.

Two versioned projection profiles are committed:

- `ivritcode-openqasm-0.1` — frozen normative QEC projection emitting `OPENQASM 3.0;`
- `ivritcode-openqasm-0.2` — experimental semantic-hold companion emitting `OPENQASM 3.1;`

Profile 0.2 intentionally keeps the same 22 letter-to-operation mappings and operand behavior as profile 0.1 so version/toolchain behavior can be reviewed separately from a semantic redesign.

The OpenQASM projection is **emit-only** inside QEC. QEC does not claim that its symbolic runtime is quantum hardware, that parser acceptance proves hardware compatibility, or that OpenQASM/Qiskit endorses the project.

## Minimal example

IvritCode source:

```text
אור
```

Frozen profile 0.1 emits:

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

The exact committed fixture is `tests/fixtures/openqasm/or-seed-09.qasm`.

## What has already been validated

The canonical corpus currently contains two programs:

- `אור`, seed 9
- `שלום`, normalized to `שלומ`, seed 17

For the committed fixtures, the repository records PASS results against:

- OpenQASM Python reference parser `openqasm3 1.0.1`
- `qiskit-qasm3-import 0.6.0` with `qiskit 2.5.0`
- Qiskit statevector execution of the unitary portion after final measurement removal
- Qiskit Rust OpenQASM 3 front end pinned to commit `3eac9970f37baf6d030a3a185b9421cca3cf0a59`

Evidence is deliberately scoped to the exact canonical fixtures. It does **not** imply validation of every IvritCode program or any quantum-hardware backend.

Inspect:

- `docs/OPENQASM_VALIDATION.md`
- `docs/OPENQASM_30_31_MATRIX.md`
- `evidence/openqasm-validation-v0.1.json`
- `evidence/openqasm-validation-matrix-v0.2.json`
- `scripts/validate-openqasm.py`

## Reproduce the validation

Prerequisites:

- Node.js/npm
- Python 3
- Git
- Rust/Cargo for the pinned Rust front end

Clone QEC and run the repository tests:

```bash
git clone https://github.com/Richardatf/QuantumEtzChaim.git
cd QuantumEtzChaim
npm ci
npm test
```

Create a Python environment and install the pinned validators:

```bash
python -m venv .venv
```

On Linux/macOS:

```bash
source .venv/bin/activate
pip install -r requirements-openqasm-validation.txt
```

On Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements-openqasm-validation.txt
```

Clone and pin the independent Rust front end:

```bash
git clone https://github.com/Qiskit/openqasm3_parser.git .external/openqasm3_parser
git -C .external/openqasm3_parser checkout 3eac9970f37baf6d030a3a185b9421cca3cf0a59
```

Run the cross-version validation:

```bash
python scripts/validate-openqasm.py --rust-parser-dir .external/openqasm3_parser
```

The validator checks the exact committed OpenQASM fixtures, records hashes, parses them through the Python reference parser and Rust front end, imports them through Qiskit, and executes the unitary portion through Qiskit's statevector machinery.

## What we want reviewed

We are asking for technical criticism rather than endorsement.

1. Are the emitted OpenQASM programs idiomatic and portable, or merely parseable?
2. Should frozen profile 0.1 remain an OpenQASM 3.0 profile while 0.2 develops against 3.1, or is another versioning policy preferable?
3. Are any of the 22 gate choices, arities, parameter choices, or deterministic operand-allocation rules poor fits for OpenQASM tooling?
4. What additional parser, simulator, or backend-facing implementation would provide the most meaningful independent next validation target?
5. Is binding the emitted source, its hash, validator versions, diagnostics, and execution evidence into the QEC Run Passport a useful reproducibility pattern? What metadata is missing?
6. What evidence should QEC require before using terms such as `parser-validated`, `simulator-validated`, or `backend-tested`?

## What we are not asking for

At this stage we are **not** asking OpenQASM to change its language specification, accept a new language feature, certify QEC, endorse QEC, or treat the QEC-1/QEC-1P physical demonstrator as quantum hardware.

If community review identifies a genuine OpenQASM language or tooling gap, that can be separated into a later proposal using the OpenQASM project's normal proposal process.

## Deeper technical material

For the fuller collaboration brief, including the complete 22-instruction map and evidence boundaries, see:

- `docs/OPENQASM_COLLABORATION.md`

For the implementation and machine-readable profiles, see:

- `src/openqasm.ts`
- `specifications/ivritcode-openqasm-v0.1.json`
- `specifications/ivritcode-openqasm-v0.2.json`
- `specifications/schemas/ivritcode-openqasm-v0.1.schema.json`
- `specifications/schemas/ivritcode-openqasm-v0.2.schema.json`
- `tests/openqasm.test.ts`

## Submission posture

OpenQASM's public repository identifies OpenQASM 3.1 as the current language version. Its contribution guidance distinguishes ordinary enhancement discussions from formal specification proposals. Because QEC is presently requesting interoperability review rather than a language change, the initial contact should be framed as a tooling/use-case discussion, not as a specification proposal.

As of 2026-09-16, the OpenQASM GitHub issues page reports that issue creation is restricted. If the connected GitHub account cannot open a new issue, the project's governance documentation identifies `#open-qasm` in the Qiskit Slack workspace as a community channel; the prepared external message is in `docs/OPENQASM_ISSUE_DRAFT.md` and can be used there to request the appropriate review path.
