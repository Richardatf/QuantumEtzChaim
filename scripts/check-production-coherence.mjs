import { appendFile } from "node:fs/promises";

const timeoutMs = Number(process.env.PRODUCTION_CHECK_TIMEOUT_MS ?? 15_000);
const cacheBust = `coherence=${Date.now()}`;

const surfaces = [
  {
    name: "Quantum Etz Chaim Contract Explorer",
    url:
      process.env.QEC_PRODUCTION_URL ??
      "https://quantumetzchaim.com/contract-explorer.html",
    markers: ["Open a Run Passport", "qec-run-passport-0.1"],
    includeScripts: false,
  },
  {
    name: "IvritCode Observatory",
    url: process.env.IVRITCODE_PRODUCTION_URL ?? "https://ivritcode.org/",
    markers: ["qec-run-passport-0.1"],
    includeScripts: true,
  },
];

function withCacheBust(url) {
  const target = new URL(url);
  target.searchParams.set("coherence", cacheBust);
  return target;
}

async function fetchText(url) {
  const response = await fetch(withCacheBust(url), {
    headers: {
      accept: "text/html,application/javascript;q=0.9,*/*;q=0.8",
      "cache-control": "no-cache",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.text();
}

function scriptUrls(html, baseUrl) {
  return [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(
    ([, src]) => new URL(src, baseUrl).href,
  );
}

async function inspectSurface(surface) {
  const html = await fetchText(surface.url);
  let searchable = html;
  let assets = [];

  if (surface.includeScripts) {
    assets = scriptUrls(html, surface.url);
    const scripts = await Promise.all(assets.map(fetchText));
    searchable += `\n${scripts.join("\n")}`;
  }

  const missing = surface.markers.filter(
    (marker) => !searchable.includes(marker),
  );
  return { ...surface, assets, missing, ok: missing.length === 0 };
}

const results = [];
for (const surface of surfaces) {
  try {
    results.push(await inspectSurface(surface));
  } catch (error) {
    results.push({
      ...surface,
      assets: [],
      missing: surface.markers,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const lines = [
  "# Production coherence",
  "",
  "| Surface | HTTP evidence | Contract markers |",
  "| --- | --- | --- |",
  ...results.map((result) => {
    const evidence = result.error
      ? `failed: ${result.error}`
      : `${1 + result.assets.length} resource(s) inspected`;
    const markers = result.ok
      ? "present"
      : `missing: ${result.missing.map((marker) => `\`${marker}\``).join(", ")}`;
    return `| ${result.name} | ${evidence} | ${markers} |`;
  }),
  "",
];

console.log(lines.join("\n"));

if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, lines.join("\n"));
}

if (results.some((result) => !result.ok)) {
  console.error(
    "Production contract drift detected. Confirm that Netlify auto publishing is unlocked and that both Git-backed production deploys are published.",
  );
  process.exitCode = 1;
}
