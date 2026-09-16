import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import runPassportSchema from "../specifications/schemas/qec-run-passport-v0.1.schema.json";
import { createIvritCodeMachineRun } from "../src/ivritcode-bridge.js";
import {
  addRunEvidence,
  inspectUnifiedRunPassport,
  parseRunPassport,
  serializeRunPassport,
} from "../src/passport.js";
import {
  encodePanelLine,
  PANEL_PROTOCOL,
  validateHostFrame,
  validatePanelFrame,
  type PanelFrame,
} from "../src/panel-protocol.js";

describe("IvritCode-to-QEC-1P release bridge", () => {
  it("carries one compiler-verified run through the complete machine contract", () => {
    const source = "שלום";
    const first = createIvritCodeMachineRun(source, 17);
    const second = createIvritCodeMachineRun(source, 17);

    expect(first.compilation.diagnostics).toEqual([]);
    expect(first.compilation.program.source).toBe(source);
    expect(first.opcodeStream).toBe("שלומ");
    expect(first.execution.program).toBe(first.opcodeStream);
    expect(first.passport).toEqual(second.passport);

    const machine = first.passport.extensions.qecMachine;
    expect(machine.trace.program).toBe(first.opcodeStream);
    expect(machine.manifestation.program).toBe(first.opcodeStream);
    expect(machine.openQasm.source).toMatch(/^OPENQASM 3\.0;/);
    expect(machine.openQasm.source).toContain('include "stdgates.inc";');
    expect(machine.openQasm.source).toContain("result = measure q;");
    expect(machine.panel.frames).toHaveLength(
      first.execution.pathEvents.length,
    );

    let previousSequence = 0;
    const acknowledgements: PanelFrame[] = [
      { type: "READY", protocol: PANEL_PROTOCOL, pixels: 4, keys: 4 },
    ];
    machine.panel.frames.forEach((frame) => {
      const validation = validateHostFrame(frame, previousSequence);
      expect(validation.ok, validation.error).toBe(true);
      expect(() => encodePanelLine(frame)).not.toThrow();
      expect(frame.traceHash).toBe(first.passport.traceHash);
      previousSequence = frame.sequence;
      acknowledgements.push({ type: "APPLIED", sequence: frame.sequence });
    });
    acknowledgements.forEach((frame) => {
      const validation = validatePanelFrame(frame);
      expect(validation.ok, validation.error).toBe(true);
    });

    const completed = addRunEvidence(first.passport, {
      mode: "simulation",
      acknowledgements,
      acceptance: {
        map: "PASS",
        handshake: "PASS",
        states: "PASS",
        brightness: "PASS",
        watchdog: "PASS",
      },
    });
    const inspection = inspectUnifiedRunPassport(completed);
    expect(inspection.valid, inspection.errors.join(", ")).toBe(true);

    const validateSchema = new Ajv2020({
      allErrors: true,
      strict: true,
    }).compile(runPassportSchema);
    expect(
      validateSchema(completed),
      JSON.stringify(validateSchema.errors),
    ).toBe(true);

    const roundTrip = parseRunPassport(serializeRunPassport(completed));
    expect(roundTrip.ok).toBe(true);
    if (!roundTrip.ok) return;
    expect(roundTrip.passport.runId).toBe(first.passport.runId);
    expect(roundTrip.passport.traceHash).toBe(first.passport.traceHash);
    expect(roundTrip.passport.extensions?.qecMachine?.evidence.mode).toBe(
      "simulation",
    );
  });

  it("fails closed when IvritCode compilation is invalid or empty", () => {
    expect(() => createIvritCodeMachineRun("", 9)).toThrow(
      /produced no machine opcodes/,
    );
    expect(() => createIvritCodeMachineRun("שָׁ", 9)).toThrow(
      /IvritCode compilation failed/,
    );
  });
});
