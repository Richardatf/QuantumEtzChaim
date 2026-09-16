from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    text = file_path.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"Expected text not found in {path}: {old[:100]!r}")
    file_path.write_text(text.replace(old, new, 1), encoding="utf-8")


replace_once(
    "index.html",
    """      .daat-node .daat-hit {
        fill: transparent;
        stroke: none;
        pointer-events: all;
      }
      .daat-node .daat-presence {
        fill: transparent;
        stroke: transparent;
        stroke-width: 1;
        pointer-events: none;
        transition: 0.3s;
      }
      .daat-node:hover .daat-presence,
      .daat-node:focus-visible .daat-presence,
      .daat-node.active .daat-presence {
        fill: rgba(112, 201, 193, 0.09);
        stroke: rgba(112, 201, 193, 0.46);
        filter: drop-shadow(0 0 8px rgba(112, 201, 193, 0.3));
      }
""",
    """      .daat-node .daat-hit {
        fill: transparent;
        stroke: none;
        pointer-events: all;
      }
      .daat-node .daat-presence {
        fill: rgba(151, 135, 190, 0.08);
        stroke: rgba(184, 168, 222, 0.72);
        stroke-width: 1.4;
        stroke-dasharray: 3 4;
        pointer-events: none;
        filter: drop-shadow(0 0 6px rgba(151, 135, 190, 0.16));
        transition: 0.3s;
      }
      .daat-node .daat-label {
        fill: rgba(209, 198, 232, 0.72);
        font: 9px var(--mono);
      }
      .daat-node .daat-label.he {
        fill: rgba(221, 211, 239, 0.82);
        font: 16px var(--serif);
      }
      .daat-node:hover .daat-presence,
      .daat-node:focus-visible .daat-presence,
      .daat-node.active .daat-presence {
        fill: rgba(151, 135, 190, 0.16);
        stroke: rgba(221, 211, 239, 0.95);
        filter: drop-shadow(0 0 10px rgba(151, 135, 190, 0.42));
      }
      .daat-node:hover .daat-label,
      .daat-node:focus-visible .daat-label,
      .daat-node.active .daat-label {
        fill: rgba(238, 232, 248, 0.96);
      }
""",
)

replace_once(
    "index.html",
    """              Ten visible sefirot organize services from intent through output.
              A smaller hidden Da’at control marks the observation boundary.""",
    """              Ten sefirot organize services from intent through output. A smaller,
              dimmed Da’at marker remains visible at the observation boundary
              without being counted among the ten.""",
)

replace_once(
    "index.html",
    """            <g
              class="node daat-node"
              data-node="daat"
              tabindex="0"
              role="button"
              aria-controls="sefirah-description"
              aria-label="Reveal the hidden Da’at observation boundary"
            >
              <circle class="daat-hit" cx="300" cy="220" r="30" />
              <circle class="daat-presence" cx="300" cy="220" r="10" />
            </g>""",
    """            <g
              id="daat"
              class="node daat-node"
              data-node="daat"
              tabindex="0"
              role="button"
              aria-controls="sefirah-description"
              aria-label="Open the Da’at observation-boundary description"
            >
              <circle class="daat-hit" cx="300" cy="220" r="30" />
              <circle class="daat-presence" cx="300" cy="220" r="27" />
              <text class="he daat-label" x="300" y="217">דעת</text>
              <text class="daat-label" x="300" y="237">DA’AT</text>
            </g>""",
)

replace_once(
    "index.html",
    """          machine:
            "Observation service + normally dark Da’at boundary indicator",
          action:
            "Appears only when observation writes a checkpoint containing state, trace position, hashes, and provenance.",
          mystical:
            "Da’at remains hidden rather than standing as an eleventh sefirah; it becomes present when wisdom and understanding are consciously joined.",""",
    """          machine: "Observation service + dimmed Da’at boundary indicator",
          action:
            "Remains visible at low intensity and brightens when observation writes a checkpoint containing state, trace position, hashes, and provenance.",
          mystical:
            "Da’at is shown as a distinct threshold rather than counted among the ten sefirot; it becomes emphasized when wisdom and understanding are consciously joined.",""",
)

replace_once(
    "index.html",
    """          name === "daat"
            ? "Hidden boundary / machine description"
            : "Selected sefirah / machine description";""",
    """          name === "daat"
            ? "Da’at boundary / machine description"
            : "Selected sefirah / machine description";""",
)

replace_once(
    "tests/landing-interaction.test.ts",
    """  it("presents Da’at as a hidden boundary rather than an eleventh visible sefirah", () => {
    expect(landingPage).toContain('class="node daat-node"');
    expect(landingPage).toContain(
      'aria-label="Reveal the hidden Da’at observation boundary"',
    );
    expect(landingPage).toContain('class="daat-hit"');
    expect(landingPage).not.toContain(
      '<text class="he" x="300" y="217">דעת</text>',
    );
  });""",
    """  it("presents Da’at as a visible boundary distinct from the ten sefirot", () => {
    expect(landingPage).toContain('id="daat"');
    expect(landingPage).toContain('class="node daat-node"');
    expect(landingPage).toContain(
      'aria-label="Open the Da’at observation-boundary description"',
    );
    expect(landingPage).toContain('class="daat-hit"');
    expect(landingPage).toContain(
      'class="daat-presence" cx="300" cy="220" r="27"',
    );
    expect(landingPage).toContain(
      '<text class="he daat-label" x="300" y="217">דעת</text>',
    );
    expect(landingPage).toContain(
      '<text class="daat-label" x="300" y="237">DA’AT</text>',
    );
    expect(landingPage).toContain("stroke-dasharray: 3 4;");
  });""",
)

replace_once(
    "console.html",
    '<span><b>10</b> HIDDEN DA’AT</span>',
    '<span><b>10</b> DIMMED DA’AT</span>',
)
replace_once(
    "src/console.ts",
    '"Hidden Da’at observation boundary"',
    '"Dimmed Da’at observation boundary"',
)
replace_once(
    "docs/QEC_1_FABRICATION_PACK.md",
    "Ten visible sefirot + hidden Da’at",
    "Ten sefirot + distinct dimmed Da’at",
)
replace_once(
    "tests/hardware.test.ts",
    "preserves hidden Da’at geometry",
    "preserves distinct Da’at geometry",
)
