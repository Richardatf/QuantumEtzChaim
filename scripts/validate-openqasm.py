#!/usr/bin/env python3
"""Validate QEC's canonical OpenQASM projections with external toolchains."""

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

PROFILE = "qec-openqasm-validation-0.1"
RUST_PARSER_COMMIT = "3eac9970f37baf6d030a3a185b9421cca3cf0a59"
PROGRAMS = (
    {
        "id": "or-seed-09",
        "ivritSource": "אור",
        "normalizedSource": "אור",
        "seed": 9,
        "fixture": "tests/fixtures/openqasm/or-seed-09.qasm",
    },
    {
        "id": "shalom-seed-17",
        "ivritSource": "שלום",
        "normalizedSource": "שלומ",
        "seed": 17,
        "fixture": "tests/fixtures/openqasm/shalom-seed-17.qasm",
    },
)


def version(distribution: str) -> str:
    return importlib.metadata.version(distribution)


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def run_rust_parser(rust_parser_dir: Path, fixture: Path) -> dict[str, Any]:
    completed = subprocess.run(
        [
            "cargo",
            "run",
            "--quiet",
            "--manifest-path",
            str(rust_parser_dir / "Cargo.toml"),
            "-p",
            "oq3_semantics",
            "--example",
            "semdemo",
            "--",
            "parse",
            str(fixture.resolve()),
        ],
        text=True,
        capture_output=True,
        check=False,
    )
    combined = "\n".join(part for part in (completed.stdout, completed.stderr) if part).strip()
    passed = completed.returncode == 0 and "Found no parse errors" in completed.stdout
    return {
        "status": "PASS" if passed else "FAIL",
        "exitCode": completed.returncode,
        "diagnostic": "Found no parse errors" if passed else combined[-4000:],
    }


def validate_program(root: Path, rust_parser_dir: Path, program: dict[str, Any]) -> dict[str, Any]:
    fixture = root / program["fixture"]
    source = fixture.read_text(encoding="utf-8")
    checks: dict[str, Any] = {}

    try:
        ast = reference_parser.parse(source)
        checks["referenceParser"] = {
            "status": "PASS",
            "statementCount": len(ast.statements),
            "diagnostic": "Parsed into the OpenQASM reference AST.",
        }
    except Exception as exc:  # pragma: no cover - exercised in CI failure only
        checks["referenceParser"] = {
            "status": "FAIL",
            "diagnostic": f"{type(exc).__name__}: {exc}",
        }

    try:
        circuit = qiskit_parse(source)
        operation_counts = {str(name): int(count) for name, count in circuit.count_ops().items()}
        checks["qiskitImporter"] = {
            "status": "PASS",
            "qubits": circuit.num_qubits,
            "classicalBits": circuit.num_clbits,
            "operations": operation_counts,
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
            "diagnostic": (
                "Unitary portion executed as a normalized Qiskit statevector."
                if simulation_passed
                else "Statevector probability norm was not one."
            ),
        }
    except Exception as exc:  # pragma: no cover - exercised in CI failure only
        diagnostic = f"{type(exc).__name__}: {exc}"
        checks.setdefault(
            "qiskitImporter", {"status": "FAIL", "diagnostic": diagnostic}
        )
        checks.setdefault(
            "qiskitStatevector", {"status": "FAIL", "diagnostic": diagnostic}
        )

    checks["rustFrontEnd"] = run_rust_parser(rust_parser_dir, fixture)
    passed = all(check["status"] == "PASS" for check in checks.values())
    return {
        **program,
        "openQasmSha256": sha256(source),
        "openQasmBytes": len(source.encode("utf-8")),
        "status": "PASS" if passed else "FAIL",
        "checks": checks,
    }


def render_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# OpenQASM external validation evidence",
        "",
        f"Profile: `{report['profile']}`",
        "",
        f"Captured: `{report['capturedAt']}`",
        "",
        f"Overall result: **{report['status']}**",
        "",
        "This report validates the exact canonical OpenQASM files emitted for the QEC evidence programs. It is external compatibility evidence, not an OpenQASM certification or endorsement.",
        "",
        "## Pinned validators",
        "",
        f"- OpenQASM Python reference parser: `openqasm3 {report['validators']['openqasm3Reference']}`",
        f"- Qiskit importer: `qiskit-qasm3-import {report['validators']['qiskitQasm3Import']}` with `qiskit {report['validators']['qiskit']}`",
        f"- Qiskit Rust OpenQASM 3 front end: `Qiskit/openqasm3_parser@{report['validators']['rustFrontEndCommit']}`",
        "",
        "## Canonical programs",
        "",
        "| Program | Seed | QASM SHA-256 | Reference parser | Qiskit import | Statevector | Rust front end |",
        "| --- | ---: | --- | --- | --- | --- | --- |",
    ]
    for program in report["programs"]:
        checks = program["checks"]
        lines.append(
            f"| `{program['ivritSource']}` (`{program['normalizedSource']}`) | {program['seed']} | `{program['openQasmSha256']}` | {checks['referenceParser']['status']} | {checks['qiskitImporter']['status']} | {checks['qiskitStatevector']['status']} | {checks['rustFrontEnd']['status']} |"
        )
    lines.extend(
        [
            "",
            "## Interpretation",
            "",
            "A PASS means the committed OpenQASM fixture parsed with the reference parser, imported into Qiskit, executed through Qiskit's statevector machinery after removing final measurement, and parsed without syntax errors by the independent Rust front end. The evidence remains intentionally scoped to the canonical corpus above; other IvritCode programs are not automatically covered by this report.",
            "",
            "The machine-readable source of record is [`../evidence/openqasm-validation-v0.1.json`](../evidence/openqasm-validation-v0.1.json).",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    argument_parser = argparse.ArgumentParser()
    argument_parser.add_argument("--rust-parser-dir", type=Path, required=True)
    argument_parser.add_argument(
        "--json-output", type=Path, default=Path("evidence/openqasm-validation-v0.1.json")
    )
    argument_parser.add_argument(
        "--markdown-output", type=Path, default=Path("docs/OPENQASM_VALIDATION.md")
    )
    args = argument_parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    rust_head = subprocess.check_output(
        ["git", "-C", str(args.rust_parser_dir), "rev-parse", "HEAD"], text=True
    ).strip()
    if rust_head != RUST_PARSER_COMMIT:
        raise SystemExit(
            f"Rust parser commit mismatch: expected {RUST_PARSER_COMMIT}, got {rust_head}"
        )

    programs = [validate_program(root, args.rust_parser_dir, program) for program in PROGRAMS]
    overall_pass = all(program["status"] == "PASS" for program in programs)
    report = {
        "profile": PROFILE,
        "capturedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "status": "PASS" if overall_pass else "FAIL",
        "scope": "canonical-corpus",
        "targetLanguage": "OpenQASM 3.0",
        "validators": {
            "openqasm3Reference": version("openqasm3"),
            "qiskitQasm3Import": version("qiskit-qasm3-import"),
            "qiskit": version("qiskit"),
            "rustFrontEndRepository": "Qiskit/openqasm3_parser",
            "rustFrontEndCommit": rust_head,
        },
        "programs": programs,
    }

    json_output = root / args.json_output
    markdown_output = root / args.markdown_output
    json_output.parent.mkdir(parents=True, exist_ok=True)
    markdown_output.parent.mkdir(parents=True, exist_ok=True)
    json_output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    markdown_output.write_text(render_markdown(report), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if overall_pass else 1


if __name__ == "__main__":
    raise SystemExit(main())
