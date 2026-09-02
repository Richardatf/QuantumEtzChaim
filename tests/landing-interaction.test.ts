import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const landingPage = readFileSync(
  new URL("../index.html", import.meta.url),
  "utf8",
);

describe("landing-page Sefirotic navigation", () => {
  it("connects every sefirah control to the description destination", () => {
    const controls = landingPage.match(/aria-controls="sefirah-description"/g);

    expect(controls).toHaveLength(11);
    expect(landingPage).toContain('id="sefirah-description"');
    expect(landingPage).toContain('aria-labelledby="node-name"');
  });

  it("moves the user to the updated description after activation", () => {
    expect(landingPage).toContain("function revealNodeDetails()");
    expect(landingPage).toContain("nodeInspector.scrollIntoView({");
    expect(landingPage).toContain("selectNode(n.dataset.node, true)");
  });
});
