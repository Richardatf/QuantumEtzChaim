import { inspectRunPassport, type QECRunPassport } from "@qec/spec";

export type PassportParseResult =
  { ok: true; passport: QECRunPassport } | { ok: false; error: string };

export function parseRunPassport(text: string): PassportParseResult {
  if (new TextEncoder().encode(text).byteLength > 5_242_880)
    return { ok: false, error: "Passport exceeds the 5 MiB contract limit." };
  try {
    const value: unknown = JSON.parse(text);
    const inspection = inspectRunPassport(value);
    return inspection.valid
      ? { ok: true, passport: value as QECRunPassport }
      : {
          ok: false,
          error: `Integrity failed: ${inspection.errors.join(", ")}.`,
        };
  } catch {
    return { ok: false, error: "Passport is not valid JSON." };
  }
}
