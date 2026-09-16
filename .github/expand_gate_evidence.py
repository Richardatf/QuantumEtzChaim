import json
import re
from pathlib import Path

ROOT = Path(".")

NEW_PROGRAMS = [
    {"id": "bereshit-seed-05", "profile": "ivritcode-qec-bridge-0.1", "source": "בראשית", "normalizedProgram": "בראשית", "seed": 5},
    {"id": "emet-seed-07", "profile": "ivritcode-qec-bridge-0.1", "source": "אמת", "normalizedProgram": "אמת", "seed": 7},
    {"id": "echad-seed-11", "profile": "ivritcode-qec-bridge-0.1", "source": "אחד", "normalizedProgram": "אחד", "seed": 11},
    {"id": "chayim-seed-13", "profile": "ivritcode-qec-bridge-0.1", "source": "חיים", "normalizedProgram": "חיימ", "seed": 13},
    {"id": "daat-seed-19", "profile": "ivritcode-qec-bridge-0.1", "source": "דעת", "normalizedProgram": "דעת", "seed": 19},
    {"id": "malkhut-seed-21", "profile": "ivritcode-qec-bridge-0.1", "source": "מלכות", "normalizedProgram": "מלכות", "seed": 21},
]

spec_path = ROOT / "specifications/qec-gate-rules-v0.1.json"
paths_path = ROOT / "specifications/qec-paths-v0.3.json"
spec = json.loads(spec_path.read_text(encoding="utf-8"))
path_spec = json.loads(paths_path.read_text(encoding="utf-8"))

known_programs = {program["id"] for program in spec["evidencePrograms"]}
for program in NEW_PROGRAMS:
    if program["id"] not in known_programs:
        spec["evidencePrograms"].append(program)

alphabet = spec["alphabet"]
index = {letter: i + 1 for i, letter in enumerate(alphabet)}
route = {path["letter"]: (path["source"], path["destination"]) for path in path_spec["paths"]}

def composition(left, right):
    left_source, left_destination = route[left]
    right_source, right_destination = route[right]
    if left_source == right_source and left_destination == right_destination:
        return "reinforcement"
    if left_destination == right_source or right_destination == left_source:
        return "continuation"
    return "crossing"

def gate_id(left, right):
    a, b = sorted((index[left], index[right]))
    return f"gate-{a}-{b}"

rules = {rule["id"]: rule for rule in spec["rules"]}

def reserved_direction(from_letter, to_letter):
    return {
        "from": from_letter,
        "to": to_letter,
        "status": "reserved",
        "executable": False,
        "composition": None,
        "evidence": None,
        "description": "The reverse invocation remains reserved for separate review.",
    }

for program in NEW_PROGRAMS:
    normalized = program["normalizedProgram"]
    for gate_index, (from_letter, to_letter) in enumerate(zip(normalized, normalized[1:])):
        if from_letter == to_letter:
            continue
        gid = gate_id(from_letter, to_letter)
        left, right = sorted((from_letter, to_letter), key=index.get)
        observed = composition(from_letter, to_letter)
        basis = (
            f"Compiler-verified {program['source']} bridge run at seed {program['seed']}: "
            f"{from_letter} followed by {to_letter}; observed {observed} topology."
        )
        if observed == "continuation":
            description = (
                f"The {from_letter} route continues directly into the {to_letter} route "
                "in the replayed machine topology."
            )
        else:
            description = (
                f"The {from_letter} and {to_letter} routes cross through shared machine "
                "state without a direct continuation node."
            )
        approved = {
            "from": from_letter,
            "to": to_letter,
            "status": "approved",
            "executable": True,
            "composition": observed,
            "evidence": {"programId": program["id"], "gateIndex": gate_index},
            "description": description,
        }
        existing = rules.get(gid)
        if existing is None:
            directions = [reserved_direction(left, right), reserved_direction(right, left)]
            for i, direction in enumerate(directions):
                if direction["from"] == from_letter and direction["to"] == to_letter:
                    directions[i] = approved
            rules[gid] = {
                "id": gid,
                "pair": f"{left}־{right}",
                "letters": [left, right],
                "status": "approved",
                "technicalBasis": basis,
                "directions": directions,
            }
        else:
            found = False
            for i, direction in enumerate(existing["directions"]):
                if direction["from"] == from_letter and direction["to"] == to_letter:
                    if direction["status"] == "approved":
                        if direction.get("evidence") != approved["evidence"]:
                            raise SystemExit(f"{from_letter}→{to_letter} already approved with different evidence")
                    else:
                        existing["directions"][i] = approved
                    found = True
                    break
            if not found:
                raise SystemExit(f"Missing direction slot for {from_letter}→{to_letter}")
            existing["status"] = "approved"
            if basis not in existing["technicalBasis"]:
                existing["technicalBasis"] = existing["technicalBasis"].rstrip(".") + "; " + basis

def rule_sort_key(rule):
    _, a, b = rule["id"].split("-")
    return int(a), int(b)

spec["rules"] = sorted(rules.values(), key=rule_sort_key)
spec_path.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def js_string(value):
    return json.dumps(value, ensure_ascii=False)

def evidence_js(programs):
    rows = ["  const GATE_EVIDENCE_PROGRAMS = Object.freeze(["]
    for program in programs:
        rows.extend([
            "    Object.freeze({",
            f'      id: {js_string(program["id"])},',
            f'      profile: {js_string(program["profile"])},',
            f'      source: {js_string(program["source"])},',
            f'      normalizedProgram: {js_string(program["normalizedProgram"])},',
            f'      seed: {program["seed"]},',
            "    }),",
        ])
    rows.append("  ]);")
    return "\n".join(rows)

def direction_js(direction, indent="        "):
    rows = [
        f"{indent}Object.freeze({{",
        f'{indent}  from: {js_string(direction["from"])},',
        f'{indent}  to: {js_string(direction["to"])},',
        f'{indent}  status: {js_string(direction["status"])},',
        f'{indent}  executable: {"true" if direction["executable"] else "false"},',
        f'{indent}  composition: {js_string(direction["composition"]) if direction["composition"] is not None else "null"},',
    ]
    evidence = direction["evidence"]
    if evidence is None:
        rows.append(f"{indent}  evidence: null,")
    else:
        rows.extend([
            f"{indent}  evidence: Object.freeze({{",
            f'{indent}    programId: {js_string(evidence["programId"])},',
            f'{indent}    gateIndex: {evidence["gateIndex"]},',
            f"{indent}  }}),",
        ])
    rows.append(f"{indent}}}),")
    return rows

def rules_js(rules_list):
    rows = ["  const REFERENCE_GATE_RULES = Object.freeze({"]
    for rule in rules_list:
        rows.extend([
            f'    {js_string(rule["id"])}: Object.freeze({{',
            f'      status: {js_string(rule["status"])},',
            f'      technicalBasis: {js_string(rule["technicalBasis"])},',
            "      directions: Object.freeze([",
        ])
        for direction in rule["directions"]:
            rows.extend(direction_js(direction))
        rows.extend(["      ]),", "    }),"])
    rows.append("  });")
    return "\n".join(rows)

core_path = ROOT / "qec/core.js"
core = core_path.read_text(encoding="utf-8")
start = core.index("  const GATE_EVIDENCE_PROGRAMS = Object.freeze([")
end = core.index("  const LETTERS = Object.freeze(", start)
core = core[:start] + evidence_js(spec["evidencePrograms"]) + "\n" + core[end:]
start = core.index("  const REFERENCE_GATE_RULES = Object.freeze({")
end = core.index("\n\n  function buildGateRegistry()", start)
core = core[:start] + rules_js(spec["rules"]) + core[end:]
core_path.write_text(core, encoding="utf-8")

tests_path = ROOT / "tests/gates.test.ts"
tests = tests_path.read_text(encoding="utf-8")
tests = tests.replace("expect(approved).toHaveLength(5);", "expect(approved).toHaveLength(22);")
tests = tests.replace("expect(approvedDirections).toHaveLength(5);", "expect(approvedDirections).toHaveLength(22);")
tests = tests.replace(").toHaveLength(457);", ").toHaveLength(440);")
anchor = '  it("keeps repeated letters outside the 231-Gate registry", () => {'
if "tracks the expanded eight-program Gate evidence milestone" not in tests:
    block = """  it(\"tracks the expanded eight-program Gate evidence milestone\", () => {
    expect(GATE_EVIDENCE_PROGRAMS).toHaveLength(8);
    expect(GATE_EVIDENCE_PROGRAMS.map((program) => program.id)).toEqual(
      expect.arrayContaining([
        \"bereshit-seed-05\",
        \"emet-seed-07\",
        \"echad-seed-11\",
        \"chayim-seed-13\",
        \"daat-seed-19\",
        \"malkhut-seed-21\",
      ]),
    );
  });

"""
    if anchor not in tests:
        raise SystemExit("Could not find Gate test insertion anchor")
    tests = tests.replace(anchor, block + anchor, 1)
tests_path.write_text(tests, encoding="utf-8")

def replace_required(path, old, new):
    p = ROOT / path
    text = p.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"Expected documentation text not found in {path}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")

replace_required(
    "README.md",
    """  the two `אור` directions and three compiler-verified `שלום` directions are
  approved with replayable evidence, while the other 457 directions remain
  explicitly reserved and non-executable""",
    """  22 directional invocations across eight compiler-verified evidence programs
  are approved with replayable evidence, while the other 440 directions remain
  explicitly reserved and non-executable""",
)

build_path = ROOT / "docs/BUILD_SPEC.md"
build = build_path.read_text(encoding="utf-8")
pattern = re.compile(
    r"The default rule is fail-closed: a visible Gate is reserved and non-executable until its directional composition, technical basis, and replayable program evidence are approved\..*?The other 457 directions remain reserved and non-executable\.",
    re.S,
)
replacement = (
    "The default rule is fail-closed: a visible Gate is reserved and non-executable until its directional composition, "
    "technical basis, and replayable program evidence are approved. The evidence registry now contains eight compiler-verified "
    "programs: `אור` seed 09, `שלום` normalized to `שלומ` seed 17, `בראשית` seed 05, `אמת` seed 07, `אחד` seed 11, "
    "`חיים` normalized to `חיימ` seed 13, `דעת` seed 19, and `מלכות` seed 21. Together they approve 22 directional "
    "Gate invocations. Each approval cites the evidence-program ID and exact zero-based Gate index. Runtime profile validation "
    "rejects an unknown evidence ID, an out-of-range index, a mismatched direction, inconsistent approval fields, or an approved "
    "rule whose declared composition disagrees with observed topology. Repeated letters remain reinforcement self-transitions "
    "outside the 231-Gate registry. The other 440 directions remain reserved and non-executable."
)
build, count = pattern.subn(replacement, build, count=1)
if count != 1:
    raise SystemExit("Could not update Gate milestone paragraph in docs/BUILD_SPEC.md")
build = build.replace(
    "231 pairs; 462 resolutions; 5 evidence-backed; 457 reserved",
    "231 pairs; 462 resolutions; 22 evidence-backed; 440 reserved",
    1,
)
build_path.write_text(build, encoding="utf-8")

replace_required(
    "qec-v0.1.html",
    """Two אור directions and three compiler-verified
            שלום directions are approved with replayable evidence; the other 457
            directions remain visible, reserved, and non-executable.""",
    """Twenty-two directional invocations across eight compiler-verified
            evidence programs are approved with replayable evidence; the other 440
            directions remain visible, reserved, and non-executable.""",
)

replace_required(
    "docs/RELEASE_READINESS.md",
    """At this milestone, two approvals come from canonical
`אור` seed 09 and three come from the compiler-verified `שלום` bridge run,
normalized to `שלומ` at seed 17. No other directional Gate is executable.""",
    """At this milestone, 22 directional approvals are replayed from eight
compiler-verified evidence programs: `אור` seed 09, `שלום` normalized to `שלומ`
seed 17, `בראשית` seed 05, `אמת` seed 07, `אחד` seed 11, `חיים` normalized to
`חיימ` seed 13, `דעת` seed 19, and `מלכות` seed 21. The remaining 440
directional Gates stay reserved and non-executable; repeated-letter reinforcement
remains a self-transition outside the 231-Gate registry.""",
)
