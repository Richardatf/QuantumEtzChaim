import { readExchange, type IvritCodeExchange } from "./exchange.js";

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
export function activationNodes(exchange: IvritCodeExchange): string[] {
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
function renderExchange(exchange: IvritCodeExchange) {
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
    `<article class="ivrit-exchange"><p class="eyebrow">IvritCode exchange · ${safe(exchange.schemaVersion)}</p><h3 lang="he" dir="rtl">${safe(exchange.source)}</h3><dl><div><dt>Hidden Key</dt><dd lang="he">${safe(exchange.hiddenKey)}</dd></div><div><dt>Pattern</dt><dd>${safe(exchange.patternShape.replaceAll("_", " "))}</dd></div><div><dt>Returning letters</dt><dd lang="he">${safe(exchange.returningLetters.join(" · ") || "—")}</dd></div><div><dt>Gates</dt><dd lang="he">${safe(exchange.gates.join(" · ") || "—")}</dd></div></dl><p>This activation is derived from deterministic IvritCode data, not prophecy or religious authority.</p><a class="btn" href="https://ivritcode.org/?source=${encodeURIComponent(exchange.source)}#try">Edit in IvritCode</a></article>`,
  );
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
  style.textContent = `.node.ivrit-active{stroke:#fff2a8;stroke-width:7;filter:drop-shadow(0 0 18px #e6d58a)}.ivrit-exchange{margin-top:1.25rem;padding:1.25rem;border:1px solid rgba(230,213,138,.4);border-radius:1rem;background:rgba(230,213,138,.06)}.ivrit-exchange h3{font-size:2rem;color:#e6d58a}.ivrit-exchange dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.75rem}.ivrit-exchange dl div{padding:.75rem;background:rgba(255,255,255,.04);border-radius:.6rem}.ivrit-exchange dt{font-size:.7rem;opacity:.65;text-transform:uppercase}.ivrit-exchange dd{margin:.25rem 0 0}`;
  document.head.append(style);
}
if (typeof location !== "undefined") {
  const exchange = readExchange(location.search);
  if (exchange) {
    renderExchange(exchange);
    document.getElementById("ivritcode")?.scrollIntoView();
  }
}
