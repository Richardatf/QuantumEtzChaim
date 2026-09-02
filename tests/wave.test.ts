import { describe, expect, it } from "vitest";
import { buildInfiniteWaveModel, registerLabels } from "../src/wave-model.js";

describe("Infinite Wave model", () => {
  it("derives three bounded projections from one canonical run", () => {
    const model = buildInfiniteWaveModel("אור", 9);

    expect(model.projections).toHaveLength(3);
    expect(
      model.projections.filter((projection) => projection.selected),
    ).toHaveLength(1);
    model.projections.forEach((projection) => {
      expect(projection.values).toHaveLength(22);
      projection.values.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(22);
      });
    });
  });

  it("keeps mirror and phase hypotheses mathematically explicit", () => {
    const model = buildInfiniteWaveModel("שלום", 4);
    const register = model.projections.find(
      (item) => item.id === "register-order",
    )!;
    const mirror = model.projections.find(
      (item) => item.id === "mirror-order",
    )!;
    const phase = model.projections.find((item) => item.id === "phase-offset")!;

    expect(mirror.values).toEqual([...register.values].reverse());
    expect(phase.values).toEqual(
      register.values.map((value) => (value + 4) % 22),
    );
  });

  it("is deterministic and preserves the canonical trace boundaries", () => {
    const first = buildInfiniteWaveModel("בראשית", 17);
    const second = buildInfiniteWaveModel("בראשית", 17);

    expect(first).toEqual(second);
    expect(first.observer.boundary).toBe("Da’at");
    expect(first.result.boundary).toBe("Malchut");
    expect(first.transformations).toHaveLength(
      [...first.source.program].length,
    );
  });

  it("uses the complete Hebrew alphabet as register labels", () => {
    expect(registerLabels()).toHaveLength(22);
    expect(registerLabels().join("")).toBe("אבגדהוזחטיכלמנסעפצקרשת");
  });
});
