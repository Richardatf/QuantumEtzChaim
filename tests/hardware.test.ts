import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import hardware from "../specifications/qec-hardware-v0.1.json";
import schema from "../specifications/schemas/qec-hardware-v0.1.schema.json";
import bom from "../specifications/qec-bom-v0.1.json";
import panelMap from "../specifications/qec-panel-map-v0.1.json";

describe("QEC-1 physical hardware model", () => {
  it("validates against its published schema", () => {
    const validate = new Ajv2020({ strict: false }).compile(schema);
    expect(validate(hardware), JSON.stringify(validate.errors)).toBe(true);
  });

  it("accounts for every physical indicator", () => {
    expect(
      hardware.panel.sefirahIndicators +
        hardware.panel.daatBoundaryIndicators +
        hardware.panel.pathIndicators +
        hardware.panel.registerIndicators,
    ).toBe(hardware.panel.totalAddressableIndicators);
    expect(hardware.panel.totalAddressableIndicators).toBe(56);
  });

  it("keeps mains outside the enclosure and both DC domains bounded", () => {
    expect(hardware.power.internalMains).toBe(false);
    expect(hardware.power.domains).toHaveLength(2);
    hardware.power.domains.forEach((domain) => {
      expect(domain.voltageV).toBe(5);
      expect(domain.maxCurrentA).toBeLessThanOrEqual(5);
    });
    expect(hardware.power.maximumTheoreticalIndicatorCurrentA).toBeLessThan(
      hardware.power.domains[1]!.maxCurrentA,
    );
  });

  it("keeps the buildable machine distinct from the laboratory extension", () => {
    expect(hardware.tiers.map((tier) => tier.boundary)).toEqual([
      "Build now",
      "Optional engineering extension",
      "Laboratory only",
    ]);
    expect(hardware.scientificBoundary.notClaimed).toMatch(
      /not a quantum processor/i,
    );
  });

  it("keeps canonical state authority on the host side of the panel link", () => {
    expect(hardware.protocol.hostToPanel).toContain("STATE");
    expect(hardware.protocol.panelToHost).toContain("APPLIED");
    expect(hardware.protocol.panelToHost).not.toContain("STATE");
    expect(hardware.protocol.hostOwns).toContain("canonical state");
    expect(hardware.protocol.panelOwns).not.toContain("canonical state");
  });

  it("maps every address once and preserves distinct Da’at geometry", () => {
    expect(panelMap.indicators).toHaveLength(56);
    expect(panelMap.indicators.map((item) => item.address)).toEqual(
      Array.from({ length: 56 }, (_, index) => index),
    );
    expect(new Set(panelMap.connectors.map((item) => item.id)).size).toBe(4);
    expect(panelMap.panel.indicatorHoleMm).toBeGreaterThan(
      panelMap.panel.daatApertureMm,
    );
    expect(panelMap.indicators[10]).toMatchObject({
      field: "daat",
      connector: "J1",
    });
  });

  it("publishes a dated, internally totaled reference BOM", () => {
    const itemTotal = bom.items.reduce(
      (total, item) => total + item.quantity * item.referenceUnitPrice,
      0,
    );
    expect(bom.status).toBe("reference-not-quote");
    expect(bom.items.map((item) => item.id)).toContain("PANEL_PSU");
    expect(bom.items.map((item) => item.id)).toContain("PIXELS");
    expect(bom.referenceTotalUsd).toBeCloseTo(
      itemTotal + bom.allowance.estimatedUsd,
      2,
    );
  });

  it("publishes the model as readable JSON", () => {
    expect(() =>
      JSON.parse(
        readFileSync(
          new URL("../specifications/qec-hardware-v0.1.json", import.meta.url),
          "utf8",
        ),
      ),
    ).not.toThrow();
  });
});
