import { describe, expect, it } from "vitest";
import panelProfile from "../specifications/qec-panel-link-v0.1.json";
import {
  PANEL_PROTOCOL,
  QEC_1P_KEYS,
  QEC_1P_PIXELS,
  encodePanelLine,
  validateHostFrame,
  validatePanelFrame,
} from "../src/panel-protocol.js";

const registers = Array.from({ length: 23 }, (_, index) => index % 22);
const state = {
  type: "STATE",
  sequence: 1,
  activePath: "א",
  sourceNode: "Keter",
  destinationNode: "Tiferet",
  registers,
  traceHash: "0123456789abcdef",
  brightness: 0.08,
} as const;

describe("qec-panel-link-0.1", () => {
  it("assigns state to the host and acknowledgements to the panel", () => {
    const hostTypes = panelProfile.hostToPanel.map((frame) => frame.type);
    const panelTypes = panelProfile.panelToHost.map((frame) => frame.type);
    expect(hostTypes).toContain("STATE");
    expect(panelTypes).toContain("APPLIED");
    expect(panelTypes).not.toContain("STATE");
    expect(hostTypes.filter((type) => panelTypes.includes(type))).toEqual([
      "HEARTBEAT",
    ]);
  });

  it("locks the reduced bench map to four keys and four pixels", () => {
    expect(QEC_1P_KEYS).toEqual(["א", "ו", "ר", "STEP"]);
    expect(QEC_1P_PIXELS).toEqual(["NODE", "PATH", "REGISTER", "LINK_FAULT"]);
    expect(panelProfile.prototype.keyGpios).toEqual([6, 7, 8, 9]);
    expect(panelProfile.prototype.pixelDataGpio).toBe(2);
  });

  it("accepts a complete state and rejects mutation-prone frames", () => {
    expect(validateHostFrame(state, 0).ok).toBe(true);
    expect(validateHostFrame({ ...state, sequence: 0 }, 0).ok).toBe(false);
    expect(validateHostFrame({ ...state, brightness: 0.26 }, 0).ok).toBe(false);
    expect(
      validateHostFrame({ ...state, registers: registers.slice(1) }, 0).ok,
    ).toBe(false);
  });

  it("validates negotiation and panel acknowledgements", () => {
    expect(
      validateHostFrame({
        type: "HELLO",
        protocol: PANEL_PROTOCOL,
        machine: "QEC-1P",
      }).ok,
    ).toBe(true);
    expect(
      validatePanelFrame({
        type: "READY",
        protocol: PANEL_PROTOCOL,
        pixels: 4,
        keys: 4,
      }).ok,
    ).toBe(true);
    expect(validatePanelFrame({ type: "APPLIED", sequence: 1 }).ok).toBe(true);
  });

  it("keeps every encoded prototype frame within the bounded transport", () => {
    expect(
      new TextEncoder().encode(encodePanelLine(state)).byteLength,
    ).toBeLessThan(4096);
  });
});
