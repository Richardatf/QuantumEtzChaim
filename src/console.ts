import {
  compareProgramSeeds,
  compareProgramRuns,
  findFirstTraceDivergence,
  HEBREW_ALPHABET,
  runOrVerticalSlice,
  runProgram,
  serializeManifestation,
  serializeTrace,
  traceExport,
  type ProgramExecutionResult,
} from "./machine.js";
import { decodeProgramPermalink, encodeProgramPermalink } from "./permalink.js";

const get = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing console element: ${selector}`);
  return element;
};

const registerGrid = get<HTMLDivElement>("#register-grid");
const pathTitle = get<HTMLElement>("#path-title");
const pathRoute = get<HTMLElement>("#path-route");
const pathDescription = get<HTMLElement>("#path-description");
const services = get<HTMLDivElement>("#services");
const gateList = get<HTMLDivElement>("#gate-list");
const gateExplorer = get<HTMLElement>("#gate-explorer");
const gateExplorerId = get<HTMLElement>("#gate-explorer-id");
const gateExplorerType = get<HTMLElement>("#gate-explorer-type");
const gateExplorerRoute = get<HTMLElement>("#gate-explorer-route");
const gateExplorerNodes = get<HTMLElement>("#gate-explorer-nodes");
const gateExplorerServices = get<HTMLElement>("#gate-explorer-services");
const gateExplorerChanges = get<HTMLElement>("#gate-explorer-changes");
const gateExplorerCoherence = get<HTMLElement>("#gate-explorer-coherence");
const gateExplorerDescription = get<HTMLElement>("#gate-explorer-description");
const observation = get<HTMLElement>("#observation");
const observationHash = get<HTMLElement>("#observation-hash");
const observationCandidates = get<HTMLDivElement>("#observation-candidates");
const observationSelection = get<HTMLElement>("#observation-selection");
const observationReason = get<HTMLElement>("#observation-reason");
const observationSnapshot = get<HTMLElement>("#observation-snapshot");
const manifestation = get<HTMLElement>("#manifestation");
const manifestationInspector = get<HTMLElement>("#manifestation-inspector");
const manifestationLetters = get<HTMLElement>("#manifestation-letters");
const manifestationBase22 = get<HTMLElement>("#manifestation-base22");
const manifestationPath = get<HTMLElement>("#manifestation-path");
const manifestationChecksum = get<HTMLElement>("#manifestation-checksum");
const exportManifestation = get<HTMLButtonElement>("#export-manifestation");
const exportTrace = get<HTMLButtonElement>("#export-trace");
const exportAudio = get<HTMLButtonElement>("#export-audio");
const exportComparison = get<HTMLButtonElement>("#export-comparison");
const exportProvenance = get<HTMLButtonElement>("#export-provenance");
const copyManifestation = get<HTMLButtonElement>("#copy-manifestation");
const playManifestation = get<HTMLButtonElement>("#play-manifestation");
const stopManifestation = get<HTMLButtonElement>("#stop-manifestation");
const copyExport = get<HTMLButtonElement>("#copy-export");
const manifestationStatus = get<HTMLElement>("#manifestation-status");
const coherenceValue = get<HTMLElement>("#coherence-value");
const activationValue = get<HTMLElement>("#activation-value");
const phaseValue = get<HTMLElement>("#phase-value");
const coherenceBar = get<HTMLElement>("#coherence-bar");
const stepLabel = get<HTMLElement>("#step-label");
const seedInput = get<HTMLInputElement>("#seed");
const previousButton = get<HTMLButtonElement>("#previous-step");
const nextButton = get<HTMLButtonElement>("#next-step");
const resetButton = get<HTMLButtonElement>("#reset-run");
const seedActive = get<HTMLElement>("#seed-active");
const seedChanged = get<HTMLElement>("#seed-changed");
const seedDistinct = get<HTMLElement>("#seed-distinct");
const seedCoherence = get<HTMLElement>("#seed-coherence");
const seedObservation = get<HTMLElement>("#seed-observation");
const seedChecksum = get<HTMLElement>("#seed-checksum");
const seedRotation = get<HTMLElement>("#seed-rotation");
const seedVerdict = get<HTMLElement>("#seed-verdict");
const activeProgram = get<HTMLElement>("#active-program");
const activeProgramCount = get<HTMLElement>("#active-program-count");
const programForm = get<HTMLFormElement>("#program-lab-form");
const programSource = get<HTMLInputElement>("#program-source");
const programStatus = get<HTMLElement>("#program-status");
const programNormalized = get<HTMLElement>("#program-normalized");
const programCounts = get<HTMLElement>("#program-counts");
const programObservation = get<HTMLElement>("#program-observation");
const programChecksum = get<HTMLElement>("#program-checksum");
const programRoute = get<HTMLElement>("#program-route");
const copyPermalink = get<HTMLButtonElement>("#copy-permalink");
const pinTrace = get<HTMLButtonElement>("#pin-trace");
const traceBaselineLabel = get<HTMLElement>("#trace-baseline");
const tracePrefix = get<HTMLElement>("#trace-prefix");
const traceRegisters = get<HTMLElement>("#trace-registers");
const traceSize = get<HTMLElement>("#trace-size");
const traceCoherence = get<HTMLElement>("#trace-coherence");
const traceObservation = get<HTMLElement>("#trace-observation");
const traceChecksum = get<HTMLElement>("#trace-checksum");
const traceDivergenceStep = get<HTMLElement>("#trace-divergence-step");
const traceDivergenceReason = get<HTMLElement>("#trace-divergence-reason");
const traceDivergenceRoute = get<HTMLElement>("#trace-divergence-route");
const traceDivergenceRegisters = get<HTMLElement>(
  "#trace-divergence-registers",
);

function initialRun(): ProgramExecutionResult {
  const permalink = decodeProgramPermalink(window.location.href);
  if (!permalink) return runOrVerticalSlice(9);
  try {
    return runProgram(permalink.program, permalink.seed);
  } catch {
    return runOrVerticalSlice(9);
  }
}

let result: ProgramExecutionResult = initialRun();
let traceBaseline: ProgramExecutionResult = runOrVerticalSlice(9);
let step = 0;
let selectedGate = 0;
seedInput.value = String(result.seed);
programSource.value = result.program;

function permalinkFor(run: ProgramExecutionResult): string {
  return encodeProgramPermalink(window.location.href, run);
}

function syncPermalink(): void {
  const url = new URL(permalinkFor(result));
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

function stateAtStep(): readonly number[] {
  return step === 0 ? result.initialState : result.pathEvents[step - 1]!.after;
}

function renderRegisters(): void {
  registerGrid.replaceChildren(
    ...stateAtStep().map((value, index) => {
      const item = document.createElement("div");
      item.className = `register ${index === 22 ? "hidden" : ""}`;
      const name = document.createElement("span");
      name.textContent = index === 22 ? "א∞" : HEBREW_ALPHABET[index]!;
      const output = document.createElement("strong");
      output.textContent = String(value).padStart(2, "0");
      const letter = document.createElement("small");
      letter.textContent = HEBREW_ALPHABET[value]!;
      item.append(name, output, letter);
      return item;
    }),
  );
}

function renderTree(): void {
  document.querySelectorAll<SVGGElement>(".console-node").forEach((node) => {
    node.classList.remove("active", "source", "destination");
  });
  document.querySelectorAll<SVGPathElement>(".console-path").forEach((path) => {
    path.classList.remove("active");
  });

  if (step === 0) return;
  const event = result.pathEvents[step - 1]!;
  document
    .querySelector<SVGGElement>(`[data-sefirah="${event.path.source}"]`)
    ?.classList.add("active", "source");
  document
    .querySelector<SVGGElement>(`[data-sefirah="${event.path.destination}"]`)
    ?.classList.add("active", "destination");
  document
    .querySelector<SVGPathElement>(`[data-letter="${event.letter}"]`)
    ?.classList.add("active");
}

function renderTrace(): void {
  if (step === 0) {
    pathTitle.textContent = "Machine initialized";
    pathRoute.textContent = "ALEPH OLAM / 09";
    pathDescription.textContent =
      "The visible alphabet is in natural order. The hidden register supplies a shared orientation without flattening the state.";
    services.textContent = "KeterService · BinahCompiler";
    coherenceValue.textContent = "—";
    activationValue.textContent = "—";
    phaseValue.textContent = "—";
    coherenceBar.style.width = "0%";
    return;
  }

  const event = result.pathEvents[step - 1]!;
  pathTitle.textContent = `${event.letter} · ${event.path.name}`;
  pathRoute.textContent = `${event.path.source.toUpperCase()} → ${event.path.destination.toUpperCase()}`;
  pathDescription.textContent = event.path.description;
  services.textContent = event.servicesInvoked.join(" · ");
  coherenceValue.textContent = event.coherence.coherence.toFixed(3);
  activationValue.textContent = event.coherence.activation.toFixed(3);
  phaseValue.textContent = `${event.coherence.phase.toFixed(3)} rad`;
  coherenceBar.style.width = `${event.coherence.coherence * 100}%`;
}

function renderSeedLab(): void {
  const comparison = compareProgramSeeds(result.program, result.seed, 9);
  seedActive.textContent = String(comparison.activeSeed).padStart(2, "0");
  seedChanged.textContent = `${comparison.changedVisibleRegisters} / 22`;
  seedDistinct.textContent = `${comparison.activeDistinctValues} / 22`;
  seedCoherence.textContent =
    comparison.coherenceDelta > 0
      ? `+${comparison.coherenceDelta.toFixed(3)}`
      : comparison.coherenceDelta.toFixed(3);
  seedObservation.textContent = comparison.observationChanged
    ? `${comparison.baselineObservation} → ${comparison.activeObservation}`
    : `${comparison.activeObservation} / unchanged`;
  seedChecksum.textContent = `${comparison.baselineChecksum} → ${comparison.activeChecksum}`;
  seedRotation.textContent = `${comparison.baselineFirstLetter} → ${comparison.activeFirstLetter}`;
  seedVerdict.textContent =
    comparison.activeDistinctValues !== 22
      ? "Warning: visible register diversity was reduced."
      : comparison.changedVisibleRegisters === 0
        ? "Canonical orientation active; all 22 visible values remain distinct."
        : "Orientation changed; all 22 visible values remain distinct.";
}

function renderProgramLab(programResult?: ProgramExecutionResult): void {
  try {
    const inspected =
      programResult ?? runProgram(programSource.value, Number(seedInput.value));
    programStatus.classList.remove("error");
    programStatus.textContent = `${inspected.pathEvents.length} deterministic instructions executed successfully.`;
    programNormalized.textContent = inspected.program;
    programCounts.textContent = `${inspected.pathEvents.length} / ${inspected.gates.length}`;
    programObservation.textContent =
      inspected.observation.selectedProjection.replaceAll("-", " ");
    programChecksum.textContent = inspected.manifestation.checksum;
    programRoute.textContent = inspected.pathEvents
      .map(
        (event) =>
          `${String(event.step).padStart(2, "0")} ${event.letter} ${event.path.source}→${event.path.destination} · ${event.path.transform.id}`,
      )
      .join("  /  ");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Program failed.";
    programStatus.classList.add("error");
    programStatus.textContent = message;
    programNormalized.textContent = "—";
    programCounts.textContent = "—";
    programObservation.textContent = "—";
    programChecksum.textContent = "—";
    programRoute.textContent =
      "Execution rejected; no partial state committed.";
  }
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function renderTraceComparison(): void {
  const comparison = compareProgramRuns(traceBaseline, result);
  const divergence = findFirstTraceDivergence(traceBaseline, result);
  const totalPaths = Math.max(
    traceBaseline.pathEvents.length,
    result.pathEvents.length,
  );
  traceBaselineLabel.textContent = `${traceBaseline.program} / ${String(traceBaseline.seed).padStart(2, "0")}`;
  tracePrefix.textContent = `${comparison.commonPathPrefix} / ${totalPaths}`;
  traceRegisters.textContent = `${comparison.changedFinalRegisters} / 23`;
  traceSize.textContent = `${signed(comparison.pathDelta)} / ${signed(comparison.gateDelta)}`;
  traceCoherence.textContent =
    comparison.coherenceDelta > 0
      ? `+${comparison.coherenceDelta.toFixed(3)}`
      : comparison.coherenceDelta.toFixed(3);
  traceObservation.textContent = comparison.observationChanged
    ? `${comparison.baselineObservation} → ${comparison.activeObservation}`
    : `${comparison.activeObservation} / unchanged`;
  traceChecksum.textContent =
    comparison.baselineChecksum === comparison.activeChecksum
      ? `${comparison.activeChecksum} / unchanged`
      : `${comparison.baselineChecksum} → ${comparison.activeChecksum}`;

  if (!divergence) {
    traceDivergenceStep.textContent = "NO DIVERGENCE";
    traceDivergenceReason.textContent = "traces are equivalent";
    traceDivergenceRoute.textContent = "Routes and transforms match.";
    traceDivergenceRegisters.textContent = "State hashes match.";
    return;
  }

  traceDivergenceStep.textContent = `FIRST DIVERGENCE / STEP ${String(divergence.step).padStart(2, "0")}`;
  traceDivergenceReason.textContent = divergence.reason.replace("-", " ");
  traceDivergenceRoute.textContent = `${divergence.baselineInstruction ?? "∅"} ${divergence.baselineRoute} · ${divergence.baselineTransform}  →  ${divergence.activeInstruction ?? "∅"} ${divergence.activeRoute} · ${divergence.activeTransform}`;
  traceDivergenceRegisters.textContent = `${divergence.baselineStateHash} → ${divergence.activeStateHash} · registers ${divergence.changedRegisters.length ? divergence.changedRegisters.map((register) => String(register).padStart(2, "0")).join(", ") : "none"}`;
}

function renderGates(): void {
  const visibleGateCount = Math.max(0, step - 1);
  gateList.replaceChildren(
    ...result.gates.map((gate, index) => {
      const card = document.createElement("article");
      card.className = `gate ${index < visibleGateCount ? "formed" : ""}`;
      card.classList.toggle("selected", index === selectedGate);
      const id = document.createElement("strong");
      id.textContent = gate.id;
      const type = document.createElement("span");
      type.textContent =
        index < visibleGateCount ? gate.composition : "awaiting path";
      const detail = document.createElement("p");
      detail.textContent =
        index < visibleGateCount
          ? gate.technicalDescription
          : "Advance the program to compose this gate.";
      card.append(id, type, detail);
      if (index < visibleGateCount) {
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `Inspect gate ${gate.id}`);
        const select = () => {
          selectedGate = index;
          renderGates();
        };
        card.addEventListener("click", select);
        card.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            select();
          }
        });
      }
      return card;
    }),
  );
  renderGateDetail(visibleGateCount);
}

function renderGateDetail(visibleGateCount: number): void {
  const available = selectedGate < visibleGateCount;
  gateExplorer.classList.toggle("revealed", available);
  if (!available) {
    gateExplorerId.textContent = "—";
    gateExplorerType.textContent = "Advance to form a gate";
    gateExplorerRoute.textContent = "—";
    gateExplorerNodes.textContent = "—";
    gateExplorerServices.textContent = "—";
    gateExplorerChanges.textContent = "—";
    gateExplorerCoherence.textContent = "—";
    gateExplorerDescription.textContent =
      "Gate metrics will be derived from two consecutive path events.";
    return;
  }

  const gate = result.gates[selectedGate]!;
  gateExplorerId.textContent = gate.id;
  gateExplorerType.textContent = gate.composition.toUpperCase();
  gateExplorerRoute.textContent = gate.route.join(" → ");
  gateExplorerNodes.textContent = gate.sharedNodes.join(" · ") || "None";
  gateExplorerServices.textContent = gate.sharedServices.join(" · ") || "None";
  gateExplorerChanges.textContent = `${gate.registerChanges} / 23`;
  gateExplorerCoherence.textContent =
    gate.coherenceDelta > 0
      ? `+${gate.coherenceDelta.toFixed(3)}`
      : gate.coherenceDelta.toFixed(3);
  gateExplorerDescription.textContent = gate.technicalDescription;
}

function renderOutput(): void {
  const complete = step === result.pathEvents.length;
  observation.classList.toggle("revealed", complete);
  manifestation.classList.toggle("revealed", complete);
  manifestationInspector.classList.toggle("revealed", complete);
  observationHash.textContent = complete ? result.observation.stateHash : "—";
  observationSelection.textContent = complete
    ? result.observation.selectedProjection.replaceAll("-", " ")
    : "Pending";
  observationReason.textContent = complete
    ? result.observation.reason.replaceAll("-", " ")
    : "Awaiting program end";
  observationSnapshot.textContent = complete
    ? `23 registers / ${result.observation.stateHash}`
    : "Not recorded";
  observationCandidates.replaceChildren(
    ...result.observation.candidates.map((candidate) => {
      const card = document.createElement("article");
      const selected =
        complete && candidate.id === result.observation.selectedProjection;
      card.className = `projection ${complete ? "revealed" : ""} ${selected ? "selected" : ""}`;
      const label = document.createElement("small");
      label.textContent = candidate.label;
      const letter = document.createElement("strong");
      letter.textContent = complete ? candidate.focusLetter : "◌";
      const hash = document.createElement("code");
      hash.textContent = complete ? candidate.stateHash : "••••••••";
      const confidence = document.createElement("span");
      confidence.textContent = complete
        ? `${(candidate.confidence * 100).toFixed(1)}% confidence`
        : "candidate projection";
      const rationale = document.createElement("p");
      rationale.textContent = candidate.rationale;
      card.append(label, letter, hash, confidence, rationale);
      return card;
    }),
  );
  manifestation.textContent = complete
    ? result.manifestation.registerString
    : "Awaiting observation";
  manifestationLetters.textContent = complete
    ? result.manifestation.registerString
    : "••••••••••••••••••••••";
  manifestationBase22.textContent = complete
    ? result.manifestation.base22Registers
    : "Awaiting observed register state";
  manifestationPath.textContent = complete
    ? result.manifestation.pathSignature
    : "Awaiting completed path trace";
  manifestationChecksum.textContent = complete
    ? result.manifestation.checksum
    : "—";
  exportManifestation.disabled = !complete;
  exportTrace.disabled = !complete;
  exportAudio.disabled = !complete;
  exportComparison.disabled = !complete;
  exportProvenance.disabled = !complete;
  copyManifestation.disabled = !complete;
  playManifestation.disabled = !complete;
  stopManifestation.disabled = true;
  copyExport.disabled = !complete;
  manifestationStatus.textContent = complete
    ? `qec-manifestation-0.2 ready / ${result.manifestation.checksum}`
    : "Output locked until Da’at observes";
}

function render(): void {
  activeProgram.textContent = result.program;
  activeProgramCount.innerHTML = `PROGRAM<br>${result.pathEvents.length} INSTRUCTIONS / ${result.gates.length} GATES`;
  stepLabel.textContent =
    step === 0
      ? "INITIAL STATE"
      : `STEP 0${step} / ${result.pathEvents[step - 1]!.letter}`;
  previousButton.disabled = step === 0;
  nextButton.disabled = step === result.pathEvents.length;
  nextButton.textContent =
    step === result.pathEvents.length ? "Observed" : "Next instruction →";
  renderRegisters();
  renderSeedLab();
  renderTraceComparison();
  renderTree();
  renderTrace();
  renderGates();
  renderOutput();
}

previousButton.addEventListener("click", () => {
  step = Math.max(0, step - 1);
  render();
});

nextButton.addEventListener("click", () => {
  step = Math.min(result.pathEvents.length, step + 1);
  selectedGate = Math.max(0, step - 2);
  render();
});

resetButton.addEventListener("click", () => {
  const seed = Number(seedInput.value);
  result = runProgram(result.program, seed);
  step = 0;
  selectedGate = 0;
  render();
  renderProgramLab();
  syncPermalink();
});

programForm.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const nextResult = runProgram(programSource.value, Number(seedInput.value));
    result = nextResult;
    programSource.value = nextResult.program;
    step = 0;
    selectedGate = 0;
    renderProgramLab(nextResult);
    render();
    syncPermalink();
  } catch {
    renderProgramLab();
  }
});

copyPermalink.addEventListener("click", async () => {
  await navigator.clipboard.writeText(permalinkFor(result));
  programStatus.classList.remove("error");
  programStatus.textContent = "Deterministic program permalink copied.";
});

pinTrace.addEventListener("click", () => {
  traceBaseline = result;
  renderTraceComparison();
  programStatus.classList.remove("error");
  programStatus.textContent = `Baseline pinned: ${result.program} / seed ${String(result.seed).padStart(2, "0")}.`;
});

copyManifestation.addEventListener("click", async () => {
  await navigator.clipboard.writeText(result.manifestation.registerString);
  manifestationStatus.textContent = "Hebrew constellation copied";
});

let audioContext: AudioContext | undefined;
let activeOscillators: OscillatorNode[] = [];

function stopManifestationSound(): void {
  activeOscillators.forEach((oscillator) => {
    try {
      oscillator.stop();
    } catch {
      // An oscillator that has already ended needs no further cleanup.
    }
  });
  activeOscillators = [];
  stopManifestation.disabled = true;
}

playManifestation.addEventListener("click", async () => {
  stopManifestationSound();
  audioContext ??= new AudioContext();
  await audioContext.resume();
  const start = audioContext.currentTime + 0.04;
  const duration = 0.14;
  const scale = [0, 2, 4, 7, 9];
  const values = result.finalState.slice(0, 22);

  activeOscillators = values.map((value, index) => {
    const oscillator = audioContext!.createOscillator();
    const gain = audioContext!.createGain();
    const note =
      scale[value % scale.length]! + 12 * Math.floor(value / scale.length);
    const onset = start + index * duration;
    oscillator.type = index % 2 === 0 ? "sine" : "triangle";
    oscillator.frequency.value = 164.81 * 2 ** (note / 12);
    gain.gain.setValueAtTime(0.0001, onset);
    gain.gain.exponentialRampToValueAtTime(0.09, onset + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, onset + duration * 0.9);
    oscillator.connect(gain).connect(audioContext!.destination);
    oscillator.start(onset);
    oscillator.stop(onset + duration);
    return oscillator;
  });
  stopManifestation.disabled = false;
  manifestationStatus.textContent = `Playing deterministic register score / ${result.manifestation.checksum}`;
  window.setTimeout(
    () => {
      activeOscillators = [];
      stopManifestation.disabled = true;
      manifestationStatus.textContent = `Sound complete / ${result.manifestation.checksum}`;
    },
    values.length * duration * 1000 + 200,
  );
});

stopManifestation.addEventListener("click", () => {
  stopManifestationSound();
  manifestationStatus.textContent = "Sound stopped";
});

copyExport.addEventListener("click", async () => {
  await navigator.clipboard.writeText(serializeManifestation(result));
  manifestationStatus.textContent = "Versioned manifestation contract copied";
});

exportManifestation.addEventListener("click", () => {
  const data = serializeManifestation(result);
  const url = URL.createObjectURL(
    new Blob([data], { type: "application/json;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `qec-${result.program}-${result.manifestation.checksum}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  manifestationStatus.textContent = "Deterministic trace exported";
});

function downloadArtifact(
  data: BlobPart,
  type: string,
  filename: string,
): void {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

exportTrace.addEventListener("click", () => {
  downloadArtifact(
    serializeTrace(result),
    "application/json;charset=utf-8",
    `qec-${result.program}-seed-${String(result.seed).padStart(2, "0")}.trace.json`,
  );
  manifestationStatus.textContent = `Complete trace exported / ${result.observation.traceHash}`;
});

function manifestationWav(run: ProgramExecutionResult): ArrayBuffer {
  const rate = 22050,
    noteSeconds = 0.14,
    frames = Math.floor(rate * noteSeconds * 22);
  const buffer = new ArrayBuffer(44 + frames * 2),
    view = new DataView(buffer);
  const text = (offset: number, value: string) =>
    [...value].forEach((character, index) =>
      view.setUint8(offset + index, character.charCodeAt(0)),
    );
  text(0, "RIFF");
  view.setUint32(4, 36 + frames * 2, true);
  text(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, frames * 2, true);
  const scale = [0, 2, 4, 7, 9];
  for (let frame = 0; frame < frames; frame++) {
    const index = Math.min(21, Math.floor(frame / (rate * noteSeconds))),
      value = run.finalState[index]!,
      frequency =
        164.81 * 2 ** ((scale[value % 5]! + 12 * Math.floor(value / 5)) / 12),
      local = (frame % (rate * noteSeconds)) / (rate * noteSeconds),
      envelope = Math.sin(Math.PI * local),
      sample =
        Math.sin((2 * Math.PI * frequency * frame) / rate) * envelope * 0.22;
    view.setInt16(
      44 + frame * 2,
      Math.max(-1, Math.min(1, sample)) * 32767,
      true,
    );
  }
  return buffer;
}

exportAudio.addEventListener("click", () => {
  downloadArtifact(
    manifestationWav(result),
    "audio/wav",
    `qec-${result.program}-${result.manifestation.checksum}.wav`,
  );
  manifestationStatus.textContent = "Deterministic WAV score exported";
});

exportComparison.addEventListener("click", () => {
  const comparison = compareProgramRuns(traceBaseline, result),
    divergence = findFirstTraceDivergence(traceBaseline, result);
  const report = `# Quantum Etz Chaim Trace Comparison\n\n- Baseline: ${traceBaseline.program} / seed ${traceBaseline.seed}\n- Active: ${result.program} / seed ${result.seed}\n- Common path prefix: ${comparison.commonPathPrefix}\n- Changed registers: ${comparison.changedFinalRegisters} / 23\n- Coherence delta: ${comparison.coherenceDelta}\n- Observation changed: ${comparison.observationChanged}\n- First divergence: ${divergence ? `step ${divergence.step} / ${divergence.reason}` : "none"}\n- Baseline checksum: ${comparison.baselineChecksum}\n- Active checksum: ${comparison.activeChecksum}\n`;
  downloadArtifact(
    report,
    "text/markdown;charset=utf-8",
    `qec-comparison-${result.manifestation.checksum}.md`,
  );
  manifestationStatus.textContent = "Comparison report exported";
});

exportProvenance.addEventListener("click", () => {
  const bundle = {
    schemaVersion: "qec-provenance-bundle-0.1",
    producer: "Quantum Etz Chaim / Malchut",
    engineVersion: "1.0.0",
    pathMapVersion: "qec-path-map-0.3.0",
    createdFrom: { program: result.program, seed: result.seed },
    trace: traceExport(result),
    manifestation: JSON.parse(serializeManifestation(result)),
    comparison: compareProgramRuns(traceBaseline, result),
  };
  downloadArtifact(
    JSON.stringify(bundle, null, 2) + "\n",
    "application/json;charset=utf-8",
    `qec-provenance-${result.manifestation.checksum}.json`,
  );
  manifestationStatus.textContent = "Provenance bundle exported";
});

render();
renderProgramLab();
syncPermalink();
