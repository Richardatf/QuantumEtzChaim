import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import hardware from "../specifications/qec-hardware-v0.1.json";
import schema from "../specifications/schemas/qec-hardware-v0.1.schema.json";

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
