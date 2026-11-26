import { HEBREW_LETTERS, LETTER_NAMES } from "@ivritcode/unicode";
import {
  IVRIT_LANGUAGE_SPEC,
  IVRIT_ENGINE_VERSION,
  QEC_PATH_MAP_VERSION,
  SEFIRAH_RESPONSIBILITIES,
  type SefirahName,
} from "@qec/spec";
import { FULL_PATHS } from "./machine.js";
import { serializeRunPassport } from "./passport.js";
import { encodeProgramPermalink } from "./permalink.js";
import {
  executeLab,
  inspectLab,
  LAB_EXAMPLES,
  labPermalink,
  readLabPermalink,
  type LabInput,
  type LabInspection,
  type LabProfile,
  type LabRun,
} from "./ivritcode-lab.js";

const get = <T extends Element>(id: string): T => {
  const value = document.querySelector<T>(`#${id}`);
  if (!value) throw new Error(`Missing workbench element: ${id}`);
  return value;
};
const source = get<HTMLTextAreaElement>("source");
const profile = get<HTMLSelectElement>("profile");
const seed = get<HTMLInputElement>("seed");
const initialR1 = get<HTMLInputElement>("r1");
const status = get<HTMLElement>("lab-status");
const output = get<HTMLElement>("run-output");
const compilerView = get<HTMLElement>("compiler-view");
let inspection: LabInspection | undefined;
let run: LabRun | undefined;
let step = 0;
let activeView = "unicode";
let selectedNode: SefirahName = "Daat";

function input(): LabInput {
  return {
    source: source.value,
    profile: profile.value as LabProfile,
    seed: seed.valueAsNumber,
    initialR1: initialR1.valueAsNumber,
  };
}
function message(value: string, error = false): void {
  status.textContent = value;
  status.classList.toggle("error", error);
}
function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The program could not be processed.";
}
function json(value: unknown): string {
  return JSON.stringify(value, null, 2);
}
function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

const nodeCoordinates: Record<SefirahName, readonly [number, number]> = {
  Keter: [300, 60],
  Chokhmah: [450, 160],
  Binah: [150, 160],
  Daat: [300, 240],
  Chesed: [450, 320],
  Gevurah: [150, 320],
  Tiferet: [300, 410],
  Netzach: [450, 500],
  Hod: [150, 500],
  Yesod: [300, 590],
  Malchut: [300, 680],
};
const hebrewNodes: Record<SefirahName, string> = {
  Keter: "כתר",
  Chokhmah: "חכמה",
  Binah: "בינה",
  Daat: "דעת",
  Chesed: "חסד",
  Gevurah: "גבורה",
  Tiferet: "תפארת",
  Netzach: "נצח",
  Hod: "הוד",
  Yesod: "יסוד",
  Malchut: "מלכות",
};
function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string>,
): SVGElementTagNameMap[K] {
  const value = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([key, text]) => value.setAttribute(key, text));
  return value;
}
for (const letter of HEBREW_LETTERS) {
  const path = FULL_PATHS[letter];
  const [x1, y1] = nodeCoordinates[path.source];
  const [x2, y2] = nodeCoordinates[path.destination];
  get<SVGGElement>("tree-paths").append(
    svg("path", {
      d: `M${x1} ${y1}L${x2} ${y2}`,
      class: "tree-path",
      "data-letter": letter,
    }),
  );
}
for (const name of Object.keys(nodeCoordinates) as SefirahName[]) {
  const [x, y] = nodeCoordinates[name];
  const group = svg("g", {
    class: "tree-node",
    "data-node": name,
    role: "button",
    tabindex: "0",
    "aria-label": `${name === "Daat" ? "Da’at" : name}: ${SEFIRAH_RESPONSIBILITIES[name]}`,
    "aria-pressed": "false",
  });
  group.append(
    svg("circle", {
      cx: String(x),
      cy: String(y),
      r: name === "Daat" ? "30" : "38",
    }),
  );
  const he = svg("text", {
    x: String(x),
    y: String(y - 2),
    class: "he",
    lang: "he",
    direction: "rtl",
  });
  he.textContent = hebrewNodes[name];
  const label = svg("text", { x: String(x), y: String(y + 18) });
  label.textContent = name === "Daat" ? "DA’AT" : name.toUpperCase();
  group.append(he, label);
  group.addEventListener("click", () => selectNode(name));
  group.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectNode(name);
    }
  });
  get<SVGGElement>("tree-nodes").append(group);
}
function selectNode(name: SefirahName): void {
  selectedNode = name;
  document
    .querySelectorAll<SVGGElement>(".tree-node")
    .forEach((node) =>
      node.setAttribute("aria-pressed", String(node.dataset.node === name)),
    );
  get<HTMLElement>("node-title").textContent =
    name === "Daat" ? "Da’at · verification boundary" : name;
  const sandboxEvents =
    run?.profile === "integer"
      ? run.sandbox.trace.events.filter((event) => event.stage === name)
      : [];
  get<HTMLElement>("node-description").textContent =
    `${SEFIRAH_RESPONSIBILITIES[name]}${sandboxEvents.length ? ` Recorded activity: ${sandboxEvents.map((event) => `${event.status}: ${event.message}`).join(" ")}` : ""}`;
}

function renderCompiler(): void {
  if (!inspection) {
    compilerView.textContent = "Choose Inspect source to read the compilation.";
    return;
  }
  const compilation = inspection.compilation;
  if (activeView === "unicode") {
    const segmenter = new Intl.Segmenter("he", { granularity: "grapheme" });
    compilerView.textContent = json({
      original: inspection.input.source,
      nfc: inspection.normalizedSource,
      graphemes: [...segmenter.segment(inspection.input.source)].map(
        (item) => ({
          text: item.segment,
          start: item.index,
          end: item.index + item.segment.length,
          codePoints: [...item.segment].map(
            (ch) =>
              `U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`,
          ),
        }),
      ),
    });
  } else if (activeView === "tokens")
    compilerView.textContent = json(compilation.program.tokens);
  else if (activeView === "ast")
    compilerView.textContent = json(compilation.program.instructions);
  else if (activeView === "ir") compilerView.textContent = json(compilation.ir);
  else
    compilerView.textContent = `${compilation.pythonSource}\n\n# Python AST representation\n${json(compilation.pythonAst)}`;
}
document.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((button) =>
  button.addEventListener("click", () => {
    activeView = button.dataset.view!;
    document
      .querySelectorAll("[data-view]")
      .forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
    renderCompiler();
  }),
);

function clearRun(): void {
  run = undefined;
  inspection = undefined;
  step = 0;
  output.hidden = true;
  get<HTMLElement>("journey-controls").hidden = true;
  get<HTMLElement>("step-description").textContent = "";
  get<HTMLElement>("run-profile").textContent = "Awaiting a run";
  get<HTMLElement>("manifest").textContent =
    "Inspect source to preview the study manifest.";
  document
    .querySelectorAll(".tree-path, .tree-node")
    .forEach((node) => node.classList.remove("active"));
  renderCompiler();
  selectNode(selectedNode);
}
function updateProfile(): void {
  const typed = profile.value === "integer";
  source.classList.toggle("typed", typed);
  source.dir = typed ? "ltr" : "rtl";
  get<HTMLElement>("seed-label").hidden = typed;
  get<HTMLElement>("r1-label").hidden = !typed;
  seed.disabled = typed;
  initialR1.disabled = !typed;
  get<HTMLElement>("profile-help").textContent = typed
    ? "Implemented: integer addition to r1. One יִ $r1, value instruction per line. This profile runs the shared QEC sandbox."
    : "Each unpointed Hebrew letter transforms the symbolic Tree state. Final forms normalize to their regular letter. This profile uses the existing QEC machine.";
  get<HTMLElement>("budget").textContent =
    `${typed ? "Up to 128 integer instructions" : "Up to 1,024 letter instructions"}; 4,096 source characters. Local execution only. Web retrieval and grid tasks are disabled. No generated Python is executed.`;
}
function changed(): void {
  clearRun();
  updateProfile();
  message("Source or inputs changed. Inspect or run this version when ready.");
}
[source, profile, seed, initialR1].forEach((control) =>
  control.addEventListener("input", changed),
);

function loadExample(id: string): void {
  const example = LAB_EXAMPLES.find((item) => item.id === id)!;
  source.value = example.source;
  profile.value = example.profile;
  get<HTMLElement>("lesson-note").textContent = example.lesson;
  document
    .querySelectorAll<HTMLButtonElement>(".lesson")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.example === id),
      ),
    );
  changed();
  message(`Loaded “${example.title}”. Choose Inspect source or Run program.`);
  get<HTMLElement>("editor").scrollIntoView({
    behavior: "auto",
    block: "start",
  });
  source.focus({ preventScroll: true });
}
for (const example of LAB_EXAMPLES) {
  const button = element("button", undefined, "lesson");
  button.type = "button";
  button.dataset.example = example.id;
  button.setAttribute("aria-pressed", "false");
  const sample = element(
    "span",
    example.source.replace(/^#[^\n]*\n/, "").split("\n")[0],
    `sample${example.profile === "integer" ? " typed" : ""}`,
  );
  sample.lang = "he";
  sample.dir = example.profile === "tree" ? "rtl" : "ltr";
  button.append(
    sample,
    element("strong", example.title),
    element(
      "small",
      example.profile === "tree" ? "Tree simulation" : "Integer sandbox",
    ),
  );
  button.addEventListener("click", () => loadExample(example.id));
  get<HTMLElement>("lessons").append(button);
}
for (const [index, letter] of HEBREW_LETTERS.entries()) {
  const button = element("button", letter);
  button.type = "button";
  button.setAttribute("aria-label", `Insert ${LETTER_NAMES[index]}`);
  button.addEventListener("click", () => {
    source.setRangeText(
      letter,
      source.selectionStart,
      source.selectionEnd,
      "end",
    );
    source.focus();
    changed();
  });
  get<HTMLElement>("letter-keys").append(button);
}
get<HTMLButtonElement>("inspect").addEventListener("click", () => {
  try {
    inspection = inspectLab(input());
    renderCompiler();
    get<HTMLElement>("manifest").textContent = json(inspection.manifest);
    message("Source inspected successfully. No new program has run.");
  } catch (error) {
    inspection = undefined;
    renderCompiler();
    message(errorMessage(error), true);
  }
});

function renderRun(): void {
  if (!run) return;
  output.hidden = false;
  get<HTMLElement>("journey-controls").hidden = false;
  document
    .querySelectorAll(".tree-path, .tree-node")
    .forEach((node) => node.classList.remove("active"));
  const registerGrid = get<HTMLElement>("registers");
  registerGrid.replaceChildren();
  const typed = run.profile === "integer";
  const count =
    run.profile === "tree"
      ? run.machine.execution.pathEvents.length
      : run.sandbox.trace.events.length;
  get<HTMLElement>("step-label").textContent = `${step} / ${count}`;
  get<HTMLButtonElement>("previous").disabled = step === 0;
  get<HTMLButtonElement>("next").disabled = step === count;
  get<HTMLElement>("run-profile").textContent = typed
    ? "Integer ADD · local sandbox"
    : "Symbolic Tree · simulation";
  if (run.profile === "tree") {
    const execution = run.machine.execution;
    const current = step === 0 ? undefined : execution.pathEvents[step - 1];
    const state = current?.after ?? execution.initialState;
    state.forEach((value, index) => {
      const card = element(
        "div",
        undefined,
        `register${index === 22 ? " seed" : ""}${current && current.before[index] !== value ? " changed" : ""}`,
      );
      const name = index === 22 ? "Seed" : HEBREW_LETTERS[index]!;
      card.title =
        index === 22
          ? "Register 23: deterministic seed metadata"
          : `Register ${index + 1}: ${name}`;
      card.append(element("span", name), element("strong", String(value)));
      registerGrid.append(card);
    });
    if (current) {
      document
        .querySelector(`[data-letter="${current.letter}"]`)
        ?.classList.add("active");
      [current.path.source, current.path.destination].forEach((name) =>
        document
          .querySelector(`[data-node="${name}"]`)
          ?.classList.add("active"),
      );
    }
    if (step === count) {
      document.querySelector('[data-node="Daat"]')?.classList.add("active");
    }
    get<HTMLElement>("step-description").textContent = current
      ? `${current.letter} · ${current.path.source} to ${current.path.destination}. ${current.path.description}`
      : "Initial state. Choose Next step to follow the first letter. Gold register borders show values changed by that instruction.";
    get<HTMLElement>("result").textContent =
      step === count
        ? execution.manifestation.registerString
        : "Advance through the letters to reveal the output.";
    get<HTMLElement>("run-identity").textContent = run.machine.passport.runId;
    const approved = execution.gates.filter((gate) => gate.executable).length;
    get<HTMLElement>("gate-note").textContent =
      `${execution.gates.length} adjacent transitions; ${approved} have executable Gate rules. Reserved pairs can be inspected as adjacent path topology; no reserved Gate rule is executed. Da’at records the final observation. Checksum: ${execution.manifestation.checksum}.`;
    const consoleLink = get<HTMLAnchorElement>("open-console");
    consoleLink.hidden = false;
    consoleLink.href = encodeProgramPermalink(
      new URL("console.html", window.location.href).href,
      { program: run.machine.opcodeStream, seed: execution.seed },
    );
    const editLink = get<HTMLAnchorElement>("edit-ivritcode");
    editLink.hidden = false;
    const editUrl = new URL("https://ivritcode.org/");
    editUrl.searchParams.set("source", run.inspection.input.source);
    editLink.href = editUrl.href;
    get<HTMLElement>("run-json").textContent = json({
      originalSource: run.inspection.input.source,
      studyManifest: run.inspection.manifest,
      runPassport: run.machine.passport,
    });
  } else {
    const event = step === 0 ? undefined : run.sandbox.trace.events[step - 1];
    if (event)
      document
        .querySelector(`[data-node="${event.stage}"]`)
        ?.classList.add("active");
    get<HTMLElement>("step-description").textContent = event
      ? `${event.stage} · ${event.status}. ${event.message}${step === count ? ` r1 = ${run.sandbox.result.outputs.r1}.` : ""}`
      : "Follow the actual recorded QEC stages, including explicit Da’at verification and Gevurah policy checks. Skipped stages remain visible.";
    get<HTMLElement>("result").textContent =
      step === count
        ? `r1 = ${run.sandbox.result.outputs.r1}`
        : `Initial r1 = ${run.inspection.input.initialR1}; advance to Malchut for the result.`;
    get<HTMLElement>("run-identity").textContent = run.sandbox.trace.replayHash;
    get<HTMLElement>("gate-note").textContent =
      `${run.sandbox.result.budgetUsed.steps} integer instructions executed. This profile uses r1 rather than the symbolic 23-register Tree. It has no machine Run Passport or OpenQASM projection.`;
    get<HTMLAnchorElement>("open-console").hidden = true;
    get<HTMLAnchorElement>("edit-ivritcode").hidden = true;
    get<HTMLElement>("run-json").textContent = run.sandbox.provenanceBundle;
  }
  get<HTMLButtonElement>("download-run").textContent = typed
    ? "Download provenance bundle"
    : "Download Run Passport";
  selectNode(selectedNode);
}
get<HTMLFormElement>("lab-form").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const next = executeLab(input());
    run = next;
    inspection = next.inspection;
    step = 0;
    renderCompiler();
    renderRun();
    get<HTMLElement>("manifest").textContent = json(inspection.manifest);
    message(
      "Run complete. Use Next step to inspect the recorded journey, or download its evidence.",
    );
  } catch (error) {
    clearRun();
    message(errorMessage(error), true);
  }
});
get<HTMLButtonElement>("previous").addEventListener("click", () => {
  step = Math.max(0, step - 1);
  renderRun();
});
get<HTMLButtonElement>("next").addEventListener("click", () => {
  step++;
  renderRun();
});
get<HTMLButtonElement>("share").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(
      labPermalink(window.location.href, input()),
    );
    message(
      "Study link copied. It contains your source and inputs; opening it will not run the program.",
    );
  } catch (error) {
    message(`Could not copy the study link. ${errorMessage(error)}`, true);
  }
});
get<HTMLButtonElement>("download-run").addEventListener("click", () => {
  if (!run) return;
  const body =
    run.profile === "tree"
      ? serializeRunPassport(run.machine.passport)
      : run.sandbox.provenanceBundle;
  const url = URL.createObjectURL(
    new Blob([body], { type: "application/json;charset=utf-8" }),
  );
  const anchor = element("a");
  anchor.href = url;
  anchor.download =
    run.profile === "tree"
      ? "qec-ivritcode-run.passport.json"
      : "qec-ivritcode-integer-provenance.json";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

function renderReference(): void {
  const query = get<HTMLInputElement>("reference-search")
    .value.trim()
    .toLocaleLowerCase();
  const cards = HEBREW_LETTERS.flatMap((letter, index) => {
    const path = FULL_PATHS[letter];
    const opcode = IVRIT_LANGUAGE_SPEC.opcodes.find(
      (item) => item.letter === letter,
    )!;
    const searchable =
      `${letter} ${LETTER_NAMES[index]} ${opcode.name} ${path.source} ${path.destination} ${path.description} ${path.services.join(" ")}`.toLowerCase();
    if (query && !searchable.includes(query)) return [];
    const card = element("article", undefined, "letter-card");
    const heading = element("h3");
    const glyph = element("span", letter, "glyph");
    glyph.lang = "he";
    heading.append(glyph, element("span", LETTER_NAMES[index]));
    card.append(
      heading,
      element("p", `Language: ${opcode.name} · ${opcode.codePoint}`),
      element("p", `Tree: ${path.source} to ${path.destination}`),
      element("p", path.description),
    );
    const insert = element("button", `Insert ${letter}`);
    insert.type = "button";
    insert.addEventListener("click", () => {
      source.setRangeText(
        letter,
        source.selectionStart,
        source.selectionEnd,
        "end",
      );
      source.focus();
      changed();
    });
    card.append(insert);
    return [card];
  });
  get<HTMLElement>("letter-reference").replaceChildren(...cards);
  get<HTMLElement>("reference-count").textContent = cards.length
    ? `${cards.length} of 22 letters`
    : "No matching letters. Try another name or service.";
}
for (const [id, definitions] of [
  ["modifier-reference", IVRIT_LANGUAGE_SPEC.modifiers],
  ["control-reference", IVRIT_LANGUAGE_SPEC.controlMarks],
] as const) {
  definitions.forEach((item) => {
    const row = element("div", undefined, "mark-row");
    row.append(
      element(
        "strong",
        item.mark.includes("ו") ? item.mark : item.mark ? `א${item.mark}` : "א",
      ),
      element(
        "p",
        `${item.name}: ${item.semantic}${item.codePoint ? ` (${item.codePoint})` : ""}`,
      ),
    );
    get<HTMLElement>(id).append(row);
  });
}
get<HTMLInputElement>("reference-search").addEventListener(
  "input",
  renderReference,
);
get<HTMLElement>("spec-version").textContent =
  `Engine ${IVRIT_ENGINE_VERSION} · ${QEC_PATH_MAP_VERSION}`;
const shared = readLabPermalink(window.location.href);
if (shared) {
  source.value = shared.source;
  profile.value = shared.profile;
  seed.value = String(shared.seed);
  initialR1.value = String(shared.initialR1);
  message(
    "Study link loaded. Inspect the source, then choose Run program. Nothing has run.",
  );
} else if (new URL(window.location.href).searchParams.has("source"))
  message(
    "This study link is invalid or exceeds the supported limits. The default lesson is loaded; nothing has run.",
    true,
  );
updateProfile();
renderReference();
selectNode("Daat");
