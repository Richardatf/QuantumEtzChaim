import { HEBREW_ALPHABET, type HebrewLetter } from "./machine.js";

export const PANEL_PROTOCOL = "qec-panel-link-0.1" as const;
export const PANEL_BAUD = 115_200;
export const PANEL_MAX_FRAME_BYTES = 4_096;
export const PANEL_MAX_BRIGHTNESS = 0.25;
export const PANEL_REGISTER_COUNT = 23;
export const QEC_1P_KEYS = ["א", "ו", "ר", "STEP"] as const;
export const QEC_1P_PIXELS = [
  "NODE",
  "PATH",
  "REGISTER",
  "LINK_FAULT",
] as const;

const SEFIROT = [
  "Keter",
  "Chokhmah",
  "Binah",
  "Chesed",
  "Gevurah",
  "Tiferet",
  "Netzach",
  "Hod",
  "Yesod",
  "Malchut",
  "Daat",
] as const;

export interface HelloFrame {
  type: "HELLO";
  protocol: typeof PANEL_PROTOCOL;
  machine: "QEC-1" | "QEC-1P";
}

export interface StateFrame {
  type: "STATE";
  sequence: number;
  activePath: HebrewLetter;
  sourceNode: (typeof SEFIROT)[number];
  destinationNode: (typeof SEFIROT)[number];
  registers: readonly number[];
  traceHash: string;
  brightness: number;
}

export interface ResetFrame {
  type: "RESET";
}

export interface BrightnessFrame {
  type: "SET_BRIGHTNESS";
  brightness: number;
}

export interface HeartbeatFrame {
  type: "HEARTBEAT";
  sequence: number;
}

export type HostFrame =
  HelloFrame | StateFrame | ResetFrame | BrightnessFrame | HeartbeatFrame;

export type PanelFrame =
  | {
      type: "READY";
      protocol: typeof PANEL_PROTOCOL;
      pixels: number;
      keys: number;
    }
  | { type: "KEY"; key: string; pressed: boolean; sequence: number }
  | { type: "APPLIED"; sequence: number }
  | { type: "FAULT"; code: string; detail: string }
  | { type: "HEARTBEAT"; sequence: number };

export interface ValidationResult<T> {
  ok: boolean;
  frame?: T;
  error?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIntegerAtLeastZero(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function fail<T>(error: string): ValidationResult<T> {
  return { ok: false, error };
}

export function validateHostFrame(
  candidate: unknown,
  previousSequence = -1,
): ValidationResult<HostFrame> {
  if (!isRecord(candidate) || typeof candidate.type !== "string") {
    return fail("frame must be an object with a type");
  }

  switch (candidate.type) {
    case "HELLO":
      if (candidate.protocol !== PANEL_PROTOCOL) {
        return fail("incompatible protocol");
      }
      if (candidate.machine !== "QEC-1" && candidate.machine !== "QEC-1P") {
        return fail("unknown machine");
      }
      return { ok: true, frame: candidate as unknown as HelloFrame };

    case "RESET":
      return { ok: true, frame: { type: "RESET" } };

    case "HEARTBEAT":
      if (!isIntegerAtLeastZero(candidate.sequence)) {
        return fail("heartbeat sequence must be a non-negative integer");
      }
      return { ok: true, frame: candidate as unknown as HeartbeatFrame };

    case "SET_BRIGHTNESS":
      if (
        typeof candidate.brightness !== "number" ||
        candidate.brightness < 0 ||
        candidate.brightness > PANEL_MAX_BRIGHTNESS
      ) {
        return fail(`brightness must be between 0 and ${PANEL_MAX_BRIGHTNESS}`);
      }
      return { ok: true, frame: candidate as unknown as BrightnessFrame };

    case "STATE": {
      if (
        !isIntegerAtLeastZero(candidate.sequence) ||
        Number(candidate.sequence) <= previousSequence
      ) {
        return fail("state sequence must increase monotonically");
      }
      if (!HEBREW_ALPHABET.includes(candidate.activePath as HebrewLetter)) {
        return fail("activePath must be a canonical Hebrew letter");
      }
      if (
        !SEFIROT.includes(candidate.sourceNode as (typeof SEFIROT)[number]) ||
        !SEFIROT.includes(candidate.destinationNode as (typeof SEFIROT)[number])
      ) {
        return fail("sourceNode and destinationNode must be canonical sefirot");
      }
      if (
        !Array.isArray(candidate.registers) ||
        candidate.registers.length !== PANEL_REGISTER_COUNT ||
        candidate.registers.some(
          (value) => !Number.isInteger(value) || value < 0 || value > 21,
        )
      ) {
        return fail("registers must contain exactly 23 base-22 integers");
      }
      if (
        typeof candidate.brightness !== "number" ||
        candidate.brightness < 0 ||
        candidate.brightness > PANEL_MAX_BRIGHTNESS
      ) {
        return fail(`brightness must be between 0 and ${PANEL_MAX_BRIGHTNESS}`);
      }
      if (
        typeof candidate.traceHash !== "string" ||
        candidate.traceHash.length < 8
      ) {
        return fail("traceHash must contain at least eight characters");
      }
      return { ok: true, frame: candidate as unknown as StateFrame };
    }

    default:
      return fail(`unknown host frame type: ${candidate.type}`);
  }
}

export function validatePanelFrame(
  candidate: unknown,
): ValidationResult<PanelFrame> {
  if (!isRecord(candidate) || typeof candidate.type !== "string") {
    return fail("panel frame must be an object with a type");
  }
  switch (candidate.type) {
    case "READY":
      if (
        candidate.protocol !== PANEL_PROTOCOL ||
        !isIntegerAtLeastZero(candidate.pixels) ||
        !isIntegerAtLeastZero(candidate.keys)
      ) {
        return fail("invalid READY frame");
      }
      break;
    case "KEY":
      if (
        typeof candidate.key !== "string" ||
        typeof candidate.pressed !== "boolean" ||
        !isIntegerAtLeastZero(candidate.sequence)
      ) {
        return fail("invalid KEY frame");
      }
      break;
    case "APPLIED":
    case "HEARTBEAT":
      if (!isIntegerAtLeastZero(candidate.sequence)) {
        return fail(`invalid ${candidate.type} sequence`);
      }
      break;
    case "FAULT":
      if (
        typeof candidate.code !== "string" ||
        typeof candidate.detail !== "string"
      ) {
        return fail("invalid FAULT frame");
      }
      break;
    default:
      return fail(`unknown panel frame type: ${candidate.type}`);
  }
  return { ok: true, frame: candidate as unknown as PanelFrame };
}

export function encodePanelLine(frame: HostFrame): string {
  const line = `${JSON.stringify(frame)}\n`;
  if (new TextEncoder().encode(line).byteLength > PANEL_MAX_FRAME_BYTES) {
    throw new Error("panel frame exceeds the 4096-byte transport limit");
  }
  return line;
}
