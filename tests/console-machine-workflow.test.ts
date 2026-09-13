import { describe, expect, it } from "vitest";
import { runProgram } from "../src/machine.js";
import {
  addRunEvidence,
  createRunPassport,
  inspectUnifiedRunPassport,
  parseRunPassport,
  serializeRunPassport,
  validateRunPassport,
} from "../src/passport.js";
import {
  PANEL_PROTOCOL,
  validateHostFrame,
  validatePanelFrame,
  type PanelFrame,
} from "../src/panel-protocol.js";

describe("complete Console-to-machine workflow", () => {
  it("carries one canonical run through panel frames and evidence", () => {
    const consoleRun = runProgram("שלום", 17);
    const passport = createRunPassport(consoleRun);
    const machine = passport.extensions.qecMachine;

    const inspection = inspectUnifiedRunPassport(passport);
    expect(inspection.valid, inspection.errors.join(", ")).toBe(true);
    expect(validateRunPassport(passport)).toBe(true);
    expect(machine.trace.program).toBe(passport.source);
    expect(machine.manifestation.program).toBe(passport.source);
    expect(machine.openQasm.source).toContain("OPENQASM 3.0;");
    expect(machine.panel.frames).toHaveLength(consoleRun.pathEvents.length);

    let previousSequence = 0;
    const acknowledgements: PanelFrame[] = [
      { type: "READY", protocol: PANEL_PROTOCOL, pixels: 4, keys: 4 },
    ];
    machine.panel.frames.forEach((frame) => {
      const validation = validateHostFrame(frame, previousSequence);
      expect(validation.ok, validation.error).toBe(true);
      expect(frame.traceHash).toBe(passport.traceHash);
      previousSequence = frame.sequence;
      acknowledgements.push({ type: "APPLIED", sequence: frame.sequence });
    });
    acknowledgements.forEach((frame) =>
      expect(validatePanelFrame(frame).ok).toBe(true),
    );

    const completed = addRunEvidence(passport, {
      mode: "physical",
      acknowledgements,
      acceptance: {
        map: "PASS",
        handshake: "PASS",
        states: "PASS",
        brightness: "PASS",
        watchdog: "PASS",
      },
    });
    const roundTrip = parseRunPassport(serializeRunPassport(completed));

    expect(roundTrip.ok).toBe(true);
    if (!roundTrip.ok) return;
    expect(roundTrip.passport.runId).toBe(passport.runId);
    expect(roundTrip.passport.traceHash).toBe(passport.traceHash);
    expect(roundTrip.passport.extensions?.qecMachine?.evidence.mode).toBe(
      "physical",
    );
    expect(
      roundTrip.passport.extensions?.qecMachine?.evidence.acknowledgements.filter(
        (frame) => frame.type === "APPLIED",
      ),
    ).toHaveLength(consoleRun.pathEvents.length);
  });
});
