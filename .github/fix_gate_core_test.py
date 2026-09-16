from pathlib import Path

path = Path("tests/qec-core-v0.1.test.js")
text = path.read_text(encoding="utf-8")

text = text.replace(
    'it("builds exactly 231 unique unordered gates with five approved directions", () => {',
    'it("builds exactly 231 unique unordered gates with 22 approved directions", () => {',
    1,
)
text = text.replace(
    'expect(QEC.GATE_EVIDENCE_PROGRAMS).toHaveLength(2);',
    'expect(QEC.GATE_EVIDENCE_PROGRAMS).toHaveLength(8);',
    1,
)
old = '''    expect(QEC.GATES.filter((item) => item.status === "approved")).toEqual([
      expect.objectContaining({ id: "gate-1-6", executable: true }),
      expect.objectContaining({ id: "gate-6-12", executable: true }),
      expect.objectContaining({ id: "gate-6-13", executable: true }),
      expect.objectContaining({ id: "gate-6-20", executable: true }),
      expect.objectContaining({ id: "gate-12-21", executable: true }),
    ]);'''
new = '''    const approved = QEC.GATES.filter((item) => item.status === "approved");
    expect(approved).toHaveLength(22);
    expect(approved).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "gate-1-6", executable: true }),
        expect.objectContaining({ id: "gate-6-12", executable: true }),
        expect.objectContaining({ id: "gate-6-13", executable: true }),
        expect.objectContaining({ id: "gate-6-20", executable: true }),
        expect.objectContaining({ id: "gate-12-21", executable: true }),
      ]),
    );'''
if old not in text:
    raise SystemExit("Expected browser-core Gate assertion block not found")
text = text.replace(old, new, 1)
path.write_text(text, encoding="utf-8")
