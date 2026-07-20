import { validateRunPassport, type QECRunPassport } from "@qec/spec";

export type PassportParseResult =
  { ok: true; passport: QECRunPassport } | { ok: false; error: string };

export function parseRunPassport(text: string): PassportParseResult {
  if (new TextEncoder().encode(text).byteLength > 5_242_880)
    return { ok: false, error: "Passport exceeds the 5 MiB contract limit." };
  try {
    const value: unknown = JSON.parse(text);
    return validateRunPassport(value)
      ? { ok: true, passport: value }
      : { ok: false, error: "JSON does not satisfy qec-run-passport-0.1." };
  } catch {
    return { ok: false, error: "Passport is not valid JSON." };
  }
}
