import {
  buildInfiniteWaveModel,
  registerLabels,
  type InfiniteWaveModel,
  type InfiniteWaveProjection,
  type WaveProjectionId,
} from "./wave-model.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const colors: Record<WaveProjectionId, string> = {
  "register-order": "#79e5d8",
  "mirror-order": "#e8c16a",
  "phase-offset": "#a78bfa",
};

function get<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing Infinite Wave element: ${selector}`);
  return element;
}

const form = get<HTMLFormElement>("#wave-form");
const sourceInput = get<HTMLInputElement>("#wave-source");
const seedInput = get<HTMLInputElement>("#wave-seed");
const errorOutput = get<HTMLElement>("#wave-error");
const pathLayer = get<SVGGElement>("#wave-paths");
const pointLayer = get<SVGGElement>("#wave-points");
const hypothesisList = get<HTMLElement>("#wave-hypotheses");
const transformList = get<HTMLElement>("#wave-transformations");
const sourceProgram = get<HTMLElement>("#source-program");
const sourceSeed = get<HTMLElement>("#source-seed");
const observerProjection = get<HTMLElement>("#observer-projection");
const observerHash = get<HTMLElement>("#observer-hash");
const observerTrace = get<HTMLElement>("#observer-trace");
const resultLetters = get<HTMLElement>("#result-letters");
const resultChecksum = get<HTMLElement>("#result-checksum");
const resultPath = get<HTMLElement>("#result-path");
const ivritCodeLink = get<HTMLAnchorElement>("#run-in-ivritcode");
const inspectedName = get<HTMLElement>("#inspected-name");
const inspectedStats = get<HTMLElement>("#inspected-stats");

let model: InfiniteWaveModel;
let inspectedProjection: WaveProjectionId = "register-order";

function pathData(values: readonly number[]): string {
  return values
    .map((value, index) => {
      const x = 42 + (index * 876) / 21;
      const y = 286 - (value / 21) * 236;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function renderChart(): void {
  pathLayer.replaceChildren();
  pointLayer.replaceChildren();
  model.projections.forEach((projection) => {
    const path = document.createElementNS(SVG_NS, "path");
    const isInspected = projection.id === inspectedProjection;
    path.setAttribute("d", pathData(projection.values));
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", colors[projection.id]);
    path.setAttribute("stroke-width", isInspected ? "4" : "2");
    path.setAttribute("opacity", isInspected ? "1" : "0.35");
    path.setAttribute("vector-effect", "non-scaling-stroke");
    path.classList.add("wave-series");
    pathLayer.append(path);

    if (isInspected) {
      projection.values.forEach((value, index) => {
        const circle = document.createElementNS(SVG_NS, "circle");
        circle.setAttribute("cx", String(42 + (index * 876) / 21));
        circle.setAttribute("cy", String(286 - (value / 21) * 236));
        circle.setAttribute("r", "4");
        circle.setAttribute("fill", colors[projection.id]);
        const title = document.createElementNS(SVG_NS, "title");
        title.textContent = `${registerLabels()[index]}: ${value}`;
        circle.append(title);
        pointLayer.append(circle);
      });
    }
  });
}

function renderHypotheses(): void {
  hypothesisList.replaceChildren(
    ...model.projections.map((projection) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "hypothesis";
      button.dataset.active = String(projection.id === inspectedProjection);
      button.style.setProperty("--series-color", colors[projection.id]);
      button.innerHTML = `<span><i></i>${projection.label}</span><b>${projection.confidence.toFixed(3)}</b><small>${projection.selected ? "Selected at Da’at" : "Candidate projection"}</small>`;
      button.addEventListener("click", () => {
        inspectedProjection = projection.id;
        renderProjectionInspection(projection);
        renderChart();
        renderHypotheses();
      });
      return button;
    }),
  );
}

function renderProjectionInspection(projection: InfiniteWaveProjection): void {
  inspectedName.textContent = projection.label;
  inspectedStats.textContent = `${projection.distinctValues} distinct values · mean ${projection.meanValue.toFixed(3)} · focus ${projection.focusLetter}`;
}

function renderTransformations(): void {
  transformList.replaceChildren(
    ...model.transformations.map((transform) => {
      const item = document.createElement("li");
      item.innerHTML = `<b>${String(transform.step).padStart(2, "0")} · ${transform.letter}</b><span>${transform.route}</span><code>${transform.transform} · C ${transform.coherence.toFixed(3)}</code>`;
      return item;
    }),
  );
}

function renderModel(nextModel: InfiniteWaveModel): void {
  model = nextModel;
  const selected = model.projections.find((projection) => projection.selected)!;
  inspectedProjection = selected.id;
  sourceProgram.textContent = model.source.program;
  sourceSeed.textContent = String(model.source.seed).padStart(2, "0");
  observerProjection.textContent = selected.label;
  observerHash.textContent = model.observer.stateHash;
  observerTrace.textContent = model.observer.traceHash;
  resultLetters.textContent = model.result.registerString;
  resultChecksum.textContent = model.result.checksum;
  resultPath.textContent = model.result.pathSignature;
  ivritCodeLink.href = `https://ivritcode.org/?source=${encodeURIComponent(model.source.program)}&seed=${model.source.seed}#try`;
  renderProjectionInspection(selected);
  renderTransformations();
  renderHypotheses();
  renderChart();
  errorOutput.textContent = "";
  errorOutput.hidden = true;
}

function readInitialState(): { program: string; seed: number } {
  const params = new URLSearchParams(window.location.search);
  const program = params.get("program") || "אור";
  const parsedSeed = Number(params.get("seed") ?? 9);
  return {
    program,
    seed:
      Number.isInteger(parsedSeed) && parsedSeed >= 0 && parsedSeed <= 21
        ? parsedSeed
        : 9,
  };
}

function executeFromControls(): void {
  try {
    const seed = Number(seedInput.value);
    const nextModel = buildInfiniteWaveModel(sourceInput.value, seed);
    renderModel(nextModel);
    const url = new URL(window.location.href);
    url.searchParams.set("program", nextModel.source.program);
    url.searchParams.set("seed", String(nextModel.source.seed));
    window.history.replaceState(null, "", url);
  } catch (error) {
    errorOutput.hidden = false;
    errorOutput.textContent =
      error instanceof Error ? error.message : "The model could not be built.";
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  executeFromControls();
});

const initial = readInitialState();
sourceInput.value = initial.program;
seedInput.value = String(initial.seed);
try {
  renderModel(buildInfiniteWaveModel(initial.program, initial.seed));
} catch {
  sourceInput.value = "אור";
  seedInput.value = "9";
  renderModel(buildInfiniteWaveModel("אור", 9));
  errorOutput.hidden = false;
  errorOutput.textContent =
    "The shared link was not a valid bounded IvritCode program. The canonical אור model is shown instead.";
}
