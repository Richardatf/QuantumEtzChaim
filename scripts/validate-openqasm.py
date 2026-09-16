#!/usr/bin/env python3
"""Validate QEC's OpenQASM 3.0/3.1 compatibility matrix with external toolchains."""

from __future__ import annotations

import argparse
import hashlib
import importlib.metadata
import json
import math
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from openqasm3 import parser as reference_parser
from qiskit.quantum_info import Statevector
from qiskit_qasm3_import import parse as qiskit_parse

PROFILE = "qec-openqasm-validation-matrix-0.2"
RUST_PARSER_COMMIT = "3eac9970f37baf6d030a3a185b9421cca3cf0a59"
PROGRAMS = (
    {"id": "or-seed-09", "ivritSource": "אור", "normalizedSource": "אור", "seed": 9, "filename": "or-seed-09.qasm"},
    {"id": "shalom-seed-17", "ivritSource": "שלום", "normalizedSource": "שלומ", "seed": 17, "filename": "shalom-seed-17.qasm"},
)
TARGETS = (
    {"profile": "ivritcode-openqasm-0.1", "targetLanguage": "OpenQASM 3.0", "fixtureDir": "tests/fixtures/openqasm", "policy": "normative-frozen"},
    {"profile": "ivritcode-openqasm-0.2", "targetLanguage": "OpenQASM 3.1", "fixtureDir": "tests/fixtures/openqasm31", "policy": "experimental-semantic-hold"},
)


def version(distribution: str) -> str:
    return importlib.metadata.version(distribution)


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def run_rust_parser(rust_parser_dir: Path, fixture: Path) -> dict[str, Any]:
    completed = subprocess.run(
        ["cargo", "run", "--quiet", "--manifest-path", str(rust_parser_dir / "Cargo.toml"), "-p", "oq3_semantics", "--example", "semdemo", "--", "parse", str(fixture.resolve())],
        text=True,
        capture_output=True,
        check=False,
    )
    combined = "\n".join(part for part in (completed.stdout, completed.stderr) if part).strip()
    passed = completed.returncode == 0 and "Found no parse errors" in completed.stdout
    return {"status": "PASS" if passed else "FAIL", "exitCode": completed.returncode, "diagnostic": "Found no parse errors" if passed else combined[-4000:]}


def validate_program(root: Path, rust_parser_dir: Path, target: dict[str, Any], program: dict[str, Any]) -> dict[str, Any]:
    fixture = root / target["fixtureDir"] / program["filename"]
    source = fixture.read_text(encoding="utf-8")
    checks: dict[str, Any] = {}
    try:
        ast = reference_parser.parse(source)
        checks["referenceParser"] = {"status": "PASS", "statementCount": len(ast.statements), "diagnostic": "Parsed into the OpenQASM reference AST."}
    except Exception as exc:
        checks["referenceParser"] = {"status": "FAIL", "diagnostic": f"{type(exc).__name__}: {exc}"}
    try:
        circuit = qiskit_parse(source)
        checks["qiskitImporter"] = {
            "status": "PASS",
            "qubits": circuit.num_qubits,
            "classicalBits": circuit.num_clbits,
            "operations": {str(name): int(count) for name, count in circuit.count_ops().items()},
            "diagnostic": "Imported into a Qiskit QuantumCircuit.",
        }
        simulation_circuit = circuit.remove_final_measurements(inplace=False)
        statevector = Statevector.from_instruction(simulation_circuit)
        norm = float(sum(abs(amplitude) ** 2 for amplitude in statevector.data))
        simulation_passed = math.isclose(norm, 1.0, rel_tol=1e-12, abs_tol=1e-12)
        checks["qiskitStatevector"] = {
            "status": "PASS" if simulation_passed else "FAIL",
            "dimension": len(statevector.data),
            "probabilityNorm": norm,
            "diagnostic": "Unitary portion executed as a normalized Qiskit statevector." if simulation_passed else "Statevector probability norm was not one.",
        }
    except Exception as exc:
        diagnostic = f"{type(exc).__name__}: {exc}"
        checks.setdefault("qiskitImporter", {"status": "FAIL", "diagnostic": diagnostic})
        checks.setdefault("qiskitStatevector", {"status": "FAIL", "diagnostic": diagnostic})
    checks["rustFrontEnd"] = run_rust_parser(rust_parser_dir, fixture)
    passed = all(check["status"] == "PASS" for check in checks.values())
    return {
        "id": program["id"],
        "ivritSource": program["ivritSource"],
        "normalizedSource": program["normalizedSource"],
        "seed": program["seed"],
        "fixture": str(fixture.relative_to(root)),
        "openQasmSha256": sha256(source),
        "openQasmBytes": len(source.encode("utf-8")),
        "status": "PASS" if passed else "FAIL",
        "checks": checks,
    }


def render_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# OpenQASM 3.0 / 3.1 compatibility matrix",
        "",
        f"Profile: `{report['profile']}`",
        "",
        f"Captured: `{report['capturedAt']}`",
        "",
        f"Overall result: **{report['status']}**",
        "",
        "QEC profile 0.1 remains the frozen Run Passport projection. Profile 0.2 is an experimental OpenQASM 3.1 semantic hold: the gate mapping and operand semantics are unchanged so this matrix isolates version/toolchain behavior.",
        "",
        "## Pinned validators",
        "",
        f"- OpenQASM Python reference parser: `openqasm3 {report['validators']['openqasm3Reference']}`",
        f"- Qiskit importer: `qiskit-qasm3-import {report['validators']['qiskitQasm3Import']}` with `qiskit {report['validators']['qiskit']}`",
        f"- Qiskit Rust OpenQASM 3 front end: `Qiskit/openqasm3_parser@{report['validators']['rustFrontEndCommit']}`",
        "",
        "## Matrix",
        "",
        "| Profile | Target | Program | Seed | Reference parser | Qiskit import | Statevector | Rust front end |",
        "| --- | --- | --- | ---: | --- | --- | --- | --- |",
    ]
    for target in report["profiles"]:
        for program in target["programs"]:
            checks = program["checks"]
            lines.append(
                f"| `{target['profile']}` | {target['targetLanguage']} | `{program['ivritSource']}` | {program['seed']} | {checks['referenceParser']['status']} | {checks['qiskitImporter']['status']} | {checks['qiskitStatevector']['status']} | {checks['rustFrontEnd']['status']} |"
            )
    lines.extend([
        "",
        "## Interpretation",
        "",
        "A PASS is compatibility evidence for the exact committed fixtures and pinned validators only. It is not OpenQASM certification, endorsement, or quantum-hardware execution. A 3.1 failure does not invalidate frozen profile 0.1; it identifies a toolchain/version boundary for review.",
        "",
        "Machine-readable evidence: [`../evidence/openqasm-validation-matrix-v0.2.json`](../evidence/openqasm-validation-matrix-v0.2.json).",
        "",
    ])
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rust-parser-dir", type=Path, required=True)
    parser.add_argument("--json-output", type=Path, default=Path("evidence/openqasm-validation-matrix-v0.2.json"))
    parser.add_argument("--markdown-output", type=Path, default=Path("docs/OPENQASM_30_31_MATRIX.md"))
    parser.add_argument("--allow-failures", action="store_true")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    rust_head = subprocess.check_output(["git", "-C", str(args.rust_parser_dir), "rev-parse", "HEAD"], text=True).strip()
    if rust_head != RUST_PARSER_COMMIT:
        raise SystemExit(f"Rust parser commit mismatch: expected {RUST_PARSER_COMMIT}, got {rust_head}")
    profiles = []
    for target in TARGETS:
        programs = [validate_program(root, args.rust_parser_dir, target, program) for program in PROGRAMS]
        profiles.append({**target, "status": "PASS" if all(p["status"] == "PASS" for p in programs) else "FAIL", "programs": programs})
    overall_pass = all(profile["status"] == "PASS" for profile in profiles)
    report = {
        "profile": PROFILE,
        "capturedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "status": "PASS" if overall_pass else "FAIL",
        "scope": "canonical-cross-version-corpus",
        "validators": {
            "openqasm3Reference": version("openqasm3"),
            "qiskitQasm3Import": version("qiskit-qasm3-import"),
            "qiskit": version("qiskit"),
            "rustFrontEndRepository": "Qiskit/openqasm3_parser",
            "rustFrontEndCommit": rust_head,
        },
        "profiles": profiles,
    }
    json_output = root / args.json_output
    markdown_output = root / args.markdown_output
    json_output.parent.mkdir(parents=True, exist_ok=True)
    markdown_output.parent.mkdir(parents=True, exist_ok=True)
    json_output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    markdown_output.write_text(render_markdown(report), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if overall_pass or args.allow_failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
