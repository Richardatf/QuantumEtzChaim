import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const landingPage = readFileSync(
  new URL("../index.html", import.meta.url),
  "utf8",
);

describe("landing-page Sefirotic navigation", () => {
  it("keeps the full Tree near the top on tablet layouts", () => {
    expect(landingPage).toContain("@media (max-width: 900px)");
    expect(landingPage).toContain("padding: 14px 0 28px;");
    expect(landingPage).toContain(".machine-facts {\n          display: none;");
    expect(landingPage).toContain("height: min(62svh, 590px);");
    expect(landingPage).toContain('class="mobile-intro"');
  });

  it("connects every sefirah control to the description destination", () => {
    const controls = landingPage.match(/aria-controls="sefirah-description"/g);

    expect(controls).toHaveLength(11);
    expect(landingPage).toContain('id="sefirah-description"');
    expect(landingPage).toContain('aria-labelledby="node-name"');
  });

  it("keeps decorative light from intercepting Tree controls", () => {
    expect(landingPage).toMatch(
      /\.tree-glow\s*\{[\s\S]*?pointer-events:\s*none;/,
    );
    expect(landingPage).toMatch(
      /#tree\s*\{[\s\S]*?position:\s*relative;[\s\S]*?z-index:\s*1;/,
    );
  });

  it("presents Da’at as a hidden boundary rather than an eleventh visible sefirah", () => {
    expect(landingPage).toContain('class="node daat-node"');
    expect(landingPage).toContain(
      'aria-label="Reveal the hidden Da’at observation boundary"',
    );
    expect(landingPage).toContain('class="daat-hit"');
    expect(landingPage).not.toContain(
      '<text class="he" x="300" y="217">דעת</text>',
    );
  });

  it("moves the user to the updated description after activation", () => {
    expect(landingPage).toContain("function revealNodeDetails()");
    expect(landingPage).toContain("nodeInspector.scrollIntoView({");
    expect(landingPage).toContain("selectNode(n.dataset.node, true)");
    expect(landingPage).toContain('class="node-inspector"');
    expect(landingPage).toContain('nodeInspector.classList.add("is-open")');
    expect(landingPage).toContain('id="return-to-tree"');
    expect(landingPage).toContain('id="node-previous"');
    expect(landingPage).toContain('id="node-next"');
  });

  it("provides complete mobile navigation instead of hiding site routes", () => {
    expect(landingPage).toContain('class="menu-toggle"');
    expect(landingPage).toContain('aria-controls="primary-nav"');
    expect(landingPage).toContain('id="primary-nav"');
    expect(landingPage).toContain('nav[data-open="true"]');
    expect(landingPage).toContain('menuToggle.setAttribute("aria-expanded"');
  });
});
