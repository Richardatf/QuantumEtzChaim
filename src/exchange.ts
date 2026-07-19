export const EXCHANGE_VERSION = "ivritcode-exchange-0.1" as const;
export interface IvritCodeExchange {
  schemaVersion: typeof EXCHANGE_VERSION;
  source: string;
  sourceHash: string;
  initialState: number[];
  finalState: number[];
  hiddenKey: string;
  patternShape: string;
  returningLetters: string[];
  gates: string[];
}
export function validateExchange(value: unknown): value is IvritCodeExchange {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<IvritCodeExchange>;
  return (
    item.schemaVersion === EXCHANGE_VERSION &&
    typeof item.source === "string" &&
    item.source.length <= 2048 &&
    Array.isArray(item.initialState) &&
    item.initialState.length === 23 &&
    Array.isArray(item.finalState) &&
    item.finalState.length === 23 &&
    item.initialState.every(validRegister) &&
    item.finalState.every(validRegister) &&
    typeof item.hiddenKey === "string" &&
    typeof item.patternShape === "string" &&
    Array.isArray(item.returningLetters) &&
    Array.isArray(item.gates)
  );
}
const validRegister = (value: unknown) =>
  Number.isInteger(value) && Number(value) >= 0 && Number(value) < 22;
export function readExchange(search: string): IvritCodeExchange | undefined {
  const raw = new URLSearchParams(search).get("exchange");
  if (!raw || raw.length > 20_000) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    return validateExchange(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}
