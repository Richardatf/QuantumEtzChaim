import { describe, expect, it } from "vitest";
import {
  decodeProgramPermalink,
  encodeProgramPermalink,
} from "../src/permalink.js";

describe("Program Lab permalinks", () => {
  it("round-trips Unicode source and seed without retaining stale state", () => {
    const url = encodeProgramPermalink(
      "https://quantumetzchaim.com/console.html?old=value#output",
      { program: "שלומ", seed: 17 },
    );
    expect(url).toBe(
      "https://quantumetzchaim.com/console.html?program=%D7%A9%D7%9C%D7%95%D7%9E&seed=17",
    );
    expect(decodeProgramPermalink(url)).toEqual({ program: "שלומ", seed: 17 });
  });

  it("defaults a missing seed to canonical 09", () => {
    expect(
      decodeProgramPermalink(
        "https://quantumetzchaim.com/console.html?program=אור",
      ),
    ).toEqual({ program: "אור", seed: 9 });
  });

  it("rejects missing source, invalid seeds, and oversized programs", () => {
    expect(
      decodeProgramPermalink("https://quantumetzchaim.com/console.html?seed=9"),
    ).toBeNull();
    expect(
      decodeProgramPermalink(
        "https://quantumetzchaim.com/console.html?program=אור&seed=22",
      ),
    ).toBeNull();
    expect(
      decodeProgramPermalink(
        `https://quantumetzchaim.com/console.html?program=${"א".repeat(1025)}`,
      ),
    ).toBeNull();
  });
});
