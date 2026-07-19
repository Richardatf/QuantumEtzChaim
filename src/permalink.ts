export interface ProgramPermalinkState {
  program: string;
  seed: number;
}

export function encodeProgramPermalink(
  baseUrl: string,
  state: ProgramPermalinkState,
): string {
  const url = new URL(baseUrl);
  url.search = "";
  url.hash = "";
  url.searchParams.set("program", state.program);
  url.searchParams.set("seed", String(state.seed));
  return url.toString();
}

export function decodeProgramPermalink(
  urlValue: string,
): ProgramPermalinkState | null {
  const url = new URL(urlValue);
  const program = url.searchParams.get("program");
  if (!program || [...program].length > 1024) return null;

  const rawSeed = url.searchParams.get("seed");
  const seed = rawSeed === null ? 9 : Number(rawSeed);
  if (!Number.isInteger(seed) || seed < 0 || seed > 21) return null;

  return { program, seed };
}
