import {
  readExchange,
  readRunPassport,
  type IvritCodeExchange,
  type QECRunPassport,
} from "./exchange.js";

const letters = [..."אבגדהוזחטיכלמנסעפצקרשת"];
const nodeIds = [
  "keter",
  "chochmah",
  "binah",
  "chesed",
  "gevurah",
  "tiferet",
  "netzach",
  "hod",
  "yesod",
  "malchut",
];
type RunArtifact = IvritCodeExchange | QECRunPassport;
export function activationNodes(exchange: RunArtifact): string[] {
  const activeLetters = new Set(
    [...exchange.source.normalize("NFD")].filter((item) =>
      letters.includes(item),
    ),
  );
  exchange.returningLetters.forEach((letter) => activeLetters.add(letter));
  return [...activeLetters]
    .map((letter) => nodeIds[letters.indexOf(letter) % nodeIds.length]!)
    .filter(Boolean);
}
function renderExchange(exchange: RunArtifact) {
  activationNodes(exchange).forEach((id) =>
    document.getElementById(id)?.classList.add("ivrit-active"),
  );
  const section = document.getElementById("ivritcode");
  if (!section) return;
  const safe = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  section.insertAdjacentHTML(
    "beforeend",
    `<article class="ivrit-exchange"><p class="eyebrow">IvritCode exchange · ${safe(exchange.schemaVersion)}</p><h3 lang="he" dir="rtl">${safe(exchange.source)}</h3><dl><div><dt>Engine</dt><dd>${safe(exchange.engineVersion)}</dd></div><div><dt>Path map</dt><dd>${safe(exchange.pathMapVersion)}</dd></div><div><dt>Seed</dt><dd>${exchange.seed}</dd></div><div><dt>Trace hash</dt><dd>${safe(exchange.traceHash)}</dd></div><div><dt>Manifestation</dt><dd>${safe(exchange.manifestationVersion)}</dd></div><div><dt>Hidden Key</dt><dd lang="he">${safe(exchange.hiddenKey)}</dd></div><div><dt>Pattern</dt><dd>${safe(exchange.patternShape.replaceAll("_", " "))}</dd></div><div><dt>Returning letters</dt><dd lang="he">${safe(exchange.returningLetters.join(" · ") || "—")}</dd></div><div><dt>Gates</dt><dd lang="he">${safe(exchange.gates.join(" · ") || "—")}</dd></div></dl><p>This activation is derived from deterministic IvritCode data, not prophecy or religious authority.</p><a class="btn" href="https://ivritcode.org/?source=${encodeURIComponent(exchange.source)}#try">Edit in IvritCode</a></article>`,
  );
}
function renderPassport(passport: QECRunPassport) {
  renderExchange(passport);
  const card = document.querySelector<HTMLElement>(
    ".ivrit-exchange:last-of-type",
  );
  if (!card) return;
  card.querySelector(".eyebrow")!.textContent =
    `Verified Run Passport · ${passport.schemaVersion}`;
  const evidence = document.createElement("section");
  evidence.className = "passport-evidence";
  evidence.innerHTML = `<h4>Write → Inspect → Manifest</h4><p class="passport-verdict">VALID · ${passport.validation.registerCount} registers · ${passport.trace.length} complete events · deterministic</p><ol>${passport.trace.map((event) => `<li><b>${String(event.sequence).padStart(2, "0")} · ${event.letter}</b><code>${event.beforeHash} → ${event.afterHash}</code><span>${event.changedRegisters.length} registers changed</span></li>`).join("")}</ol><div class="passport-actions"><button type="button" id="download-passport">Download passport</button><a class="btn" href="console.html?program=${encodeURIComponent(passport.source)}&seed=${passport.seed}#manifestation-inspector">Manifest in Malchut</a></div>`;
  card.append(evidence);
  card
    .querySelector<HTMLButtonElement>("#download-passport")
    ?.addEventListener("click", () => {
      const url = URL.createObjectURL(
        new Blob([`${JSON.stringify(passport, null, 2)}\n`], {
          type: "application/json",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `qec-${passport.runId}.passport.json`;
      link.click();
      URL.revokeObjectURL(url);
    });
}
if (typeof document !== "undefined")
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) =>
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.hash);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", link.hash);
    }),
  );
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `.node.ivrit-active circle{fill:#18342f;stroke:#fff2a8;stroke-width:4;filter:drop-shadow(0 0 18px #e6d58a)}.ivrit-exchange{margin:2rem auto 0;padding:1.5rem;border:1px solid rgba(230,213,138,.4);border-radius:1rem;background:rgba(230,213,138,.06);text-align:left;max-width:900px}.ivrit-exchange h3{font-size:2.4rem;color:#e6d58a;text-align:left}.ivrit-exchange dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.75rem}.ivrit-exchange dl div{padding:.75rem;background:rgba(255,255,255,.04);border-radius:.6rem}.ivrit-exchange dt{font-size:.7rem;opacity:.65;text-transform:uppercase}.ivrit-exchange dd{margin:.25rem 0 0}.ivrit-exchange .btn,.passport-actions button{display:inline-flex;margin-top:1rem;padding:.8rem 1.1rem;border:1px solid rgba(230,213,138,.6);border-radius:100px;color:#f0d995;background:transparent;text-decoration:none;font:400 11px var(--mono);cursor:pointer}.passport-evidence{margin-top:1.4rem;padding-top:1.2rem;border-top:1px solid rgba(230,213,138,.25)}.passport-evidence h4{font:1.5rem var(--serif);margin:.2rem 0}.passport-verdict{color:#69d8bd}.passport-evidence ol{display:grid;gap:.45rem;padding:0;list-style:none}.passport-evidence li{display:grid;grid-template-columns:80px 1fr auto;gap:.8rem;padding:.7rem;background:rgba(255,255,255,.04)}.passport-evidence code{color:#9edbd3}.passport-evidence span{opacity:.7}.passport-actions{display:flex;gap:.6rem;flex-wrap:wrap}`;
  document.head.append(style);
}
if (typeof location !== "undefined") {
  const passport = readRunPassport(location.search);
  const exchange = passport ?? readExchange(location.search);
  if (exchange) {
    if (passport) renderPassport(passport);
    else renderExchange(exchange);
    document.getElementById("ivritcode")?.scrollIntoView();
  }
}
