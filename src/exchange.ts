import {
  IVRIT_EXCHANGE_VERSION,
  validateIvritCodeExchange,
  validateRunPassport,
  type QECRunPassport,
  type IvritCodeExchange,
} from "@qec/spec";

export { IVRIT_EXCHANGE_VERSION as EXCHANGE_VERSION };
export type { IvritCodeExchange };
export type { QECRunPassport };
export const validateExchange = validateIvritCodeExchange;

export function readExchange(search: string): IvritCodeExchange | undefined {
  const raw = new URLSearchParams(search).get("exchange");
  if (!raw || raw.length > 20_000) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    return validateIvritCodeExchange(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function readRunPassport(search: string): QECRunPassport | undefined {
  const raw = new URLSearchParams(search).get("passport");
  if (!raw || raw.length > 250_000) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    return validateRunPassport(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}
