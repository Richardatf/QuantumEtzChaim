import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const primaryPages = [
  "index.html",
  "console.html",
  "ivritcode.html",
  "qec-v0.1.html",
  "wave.html",
  "machine.html",
  "contract-explorer.html",
];
const pages = [...primaryPages, "bench.html", "research.html"];

describe("QEC site navigation contract", () => {
  it.each(pages)(
    "keeps every primary destination and a working content skip on %s",
    (page) => {
      const html = readFileSync(new URL(`../${page}`, import.meta.url), "utf8");
      const nav = html.match(/<nav\b[^>]*id="primary-nav"[\s\S]*?<\/nav>/)?.[0];
      expect(nav, page).toBeDefined();
      const links = [...nav!.matchAll(/<a\b([^>]*?)href="([^"]+)"([^>]*)>/g)];
      expect(links.map((link) => link[2])).toEqual(primaryPages);
      for (const destination of primaryPages)
        expect(existsSync(new URL(`../${destination}`, import.meta.url))).toBe(
          true,
        );
      const current = links.filter((link) =>
        `${link[1]} ${link[3]}`.includes('aria-current="page"'),
      );
      expect(current.map((link) => link[2])).toEqual(
        primaryPages.includes(page) ? [page] : [],
      );
      expect(html).toMatch(/class="qec-skip" href="#main-content"/);
      expect(html).toMatch(/<main\b[^>]*id="main-content"/);
      expect(html.match(/id="primary-nav"/g)).toHaveLength(1);
      expect(html).toContain('src="/src/site.ts"');
      expect(html).toContain('href="/css/site.css"');
      expect(html).toContain('class="qec-site-footer"');
    },
  );

  it("preserves every original homepage research anchor on the new research page", () => {
    const research = readFileSync(
      new URL("../research.html", import.meta.url),
      "utf8",
    );
    for (const id of [
      "why-openqasm",
      "bridge",
      "quantum-target",
      "help",
      "evidence",
      "join",
    ])
      expect(research).toContain(`id="${id}"`);
    expect(research).toContain('id="qasm-source"');
    expect(research).toContain('src="/src/research.ts"');
  });
});
