import {
  IVRIT_EXCHANGE_VERSION,
  validateIvritCodeExchange,
  type IvritCodeExchange,
} from "@qec/spec";

export { IVRIT_EXCHANGE_VERSION as EXCHANGE_VERSION };
export type { IvritCodeExchange };
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
