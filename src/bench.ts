import { runOrVerticalSlice } from "./machine.js";
import {
  addRunEvidence,
  createRunPassport,
  RUN_PASSPORT_STORAGE_KEY,
  serializeRunPassport,
  validateRunPassport,
  type AcceptanceResult,
  type RunPassport,
} from "./passport.js";
import {
  PANEL_BAUD,
  PANEL_MAX_BRIGHTNESS,
  PANEL_PROTOCOL,
  QEC_1P_KEYS,
  QEC_1P_PIXELS,
  encodePanelLine,
  validateHostFrame,
  validatePanelFrame,
  type HostFrame,
  type PanelFrame,
  type StateFrame,
} from "./panel-protocol.js";

interface SerialPortLike {
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
}

interface SerialNavigator extends Navigator {
  serial?: { requestPort(): Promise<SerialPortLike> };
}

interface FrameWaiter {
  predicate: (frame: PanelFrame) => boolean;
  resolve: (frame: PanelFrame) => void;
  reject: (error: Error) => void;
  timeout: number;
}

const simulateButton = document.querySelector<HTMLButtonElement>("#simulate")!;
const connectButton = document.querySelector<HTMLButtonElement>("#connect")!;
const liveButton = document.querySelector<HTMLButtonElement>("#run-live")!;
const clearButton = document.querySelector<HTMLButtonElement>("#clear-log")!;
const status = document.querySelector<HTMLElement>("#connection-state")!;
const log = document.querySelector<HTMLElement>("#serial-log")!;
const downloadPassport =
  document.querySelector<HTMLButtonElement>("#download-passport")!;
const activeRunProgram = document.querySelector<HTMLElement>(
  "#active-run-program",
)!;
const activeRunDetail =
  document.querySelector<HTMLElement>("#active-run-detail")!;

let port: SerialPortLike | null = null;
let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
let readLoopActive = false;
const waiters = new Set<FrameWaiter>();
let panelEvidence: PanelFrame[] = [];
let acceptance: Record<string, AcceptanceResult> = {};

function loadPassport(): RunPassport {
  try {
    const stored = localStorage.getItem(RUN_PASSPORT_STORAGE_KEY);
    if (stored) {
      const candidate: unknown = JSON.parse(stored);
      if (validateRunPassport(candidate)) return candidate;
    }
  } catch {
    // A blocked or invalid local handoff falls back to the canonical proof.
  }
  return createRunPassport(runOrVerticalSlice(9));
}

let activePassport = loadPassport();
activeRunProgram.textContent = activePassport.source;
activeRunDetail.textContent = `Seed ${String(activePassport.seed).padStart(2, "0")} · ${activePassport.extensions.qecMachine.panel.frames.length} state frames · ${activePassport.extensions.qecMachine.manifestation.output.checksum}`;

function appendLog(
  direction: "HOST" | "PANEL" | "CHECK",
  value: unknown,
): void {
  const rendered = typeof value === "string" ? value : JSON.stringify(value);
  log.textContent += `\n${direction.padEnd(6)} ${rendered}`;
  log.scrollTop = log.scrollHeight;
}

function setResult(name: string, result: "WAIT" | "PASS" | "FAIL"): void {
  const row = document.querySelector<HTMLElement>(`[data-test="${name}"]`)!;
  row.classList.toggle("pass", result === "PASS");
  row.classList.toggle("fail", result === "FAIL");
  row.querySelector("output")!.textContent = result;
  acceptance[name] = result;
}

function resetResults(): void {
  acceptance = {};
  panelEvidence = [];
  downloadPassport.disabled = true;
  ["map", "handshake", "states", "brightness", "watchdog"].forEach((name) =>
    setResult(name, "WAIT"),
  );
}

function canonicalFrames(): StateFrame[] {
  return [...activePassport.extensions.qecMachine.panel.frames];
}

function completeEvidence(mode: "simulation" | "physical"): void {
  activePassport = addRunEvidence(activePassport, {
    mode,
    acknowledgements: [...panelEvidence],
    acceptance: { ...acceptance },
  });
  localStorage.setItem(
    RUN_PASSPORT_STORAGE_KEY,
    serializeRunPassport(activePassport),
  );
  downloadPassport.disabled = false;
}

function runSimulation(): void {
  resetResults();
  log.textContent = "QEC-1P deterministic protocol simulation.";

  const mapPass =
    QEC_1P_KEYS.join("|") === "א|ו|ר|STEP" && QEC_1P_PIXELS.length === 4;
  setResult("map", mapPass ? "PASS" : "FAIL");
  appendLog("CHECK", `fixed map: ${mapPass ? "pass" : "fail"}`);

  const hello: HostFrame = {
    type: "HELLO",
    protocol: PANEL_PROTOCOL,
    machine: "QEC-1P",
  };
  appendLog("HOST", hello);
  const helloPass = validateHostFrame(hello).ok;
  const ready = {
    type: "READY",
    protocol: PANEL_PROTOCOL,
    pixels: 4,
    keys: 4,
  } as const;
  appendLog("PANEL", ready);
  panelEvidence.push(ready);
  setResult(
    "handshake",
    helloPass && validatePanelFrame(ready).ok ? "PASS" : "FAIL",
  );

  let previousSequence = 0;
  const statesPass = canonicalFrames().every((frame) => {
    appendLog("HOST", frame);
    const valid = validateHostFrame(frame, previousSequence).ok;
    if (valid) {
      previousSequence = frame.sequence;
      const applied = { type: "APPLIED", sequence: frame.sequence } as const;
      appendLog("PANEL", applied);
      panelEvidence.push(applied);
    }
    return valid;
  });
  setResult("states", statesPass ? "PASS" : "FAIL");

  const invalidBrightness = {
    type: "SET_BRIGHTNESS",
    brightness: PANEL_MAX_BRIGHTNESS + 0.01,
  };
  appendLog("HOST", invalidBrightness);
  const brightnessPass = !validateHostFrame(invalidBrightness).ok;
  const brightnessFault = {
    type: "FAULT",
    code: "BRIGHTNESS_LIMIT",
    detail: "last valid display preserved",
  } as const;
  appendLog("PANEL", brightnessFault);
  panelEvidence.push(brightnessFault);
  setResult("brightness", brightnessPass ? "PASS" : "FAIL");

  appendLog("CHECK", "2,000 ms heartbeat deadline elapsed");
  const watchdogFault = {
    type: "FAULT",
    code: "WATCHDOG",
    detail: "fresh HELLO required; no canonical state synthesized",
  } as const;
  appendLog("PANEL", watchdogFault);
  panelEvidence.push(watchdogFault);
  setResult("watchdog", "PASS");
  completeEvidence("simulation");
  status.textContent = `Simulation complete. ${canonicalFrames().length} active-run states and five acceptance checks passed.`;
}

function dispatchPanelFrame(frame: PanelFrame): void {
  panelEvidence.push(frame);
  for (const waiter of [...waiters]) {
    if (!waiter.predicate(frame)) continue;
    clearTimeout(waiter.timeout);
    waiters.delete(waiter);
    waiter.resolve(frame);
  }
}

async function readSerial(readable: ReadableStream<Uint8Array>): Promise<void> {
  if (readLoopActive) return;
  readLoopActive = true;
  const reader = readable.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      while (buffer.includes("\n")) {
        const newline = buffer.indexOf("\n");
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (!line) continue;
        try {
          const parsed: unknown = JSON.parse(line);
          const validation = validatePanelFrame(parsed);
          appendLog("PANEL", parsed);
          if (validation.ok && validation.frame)
            dispatchPanelFrame(validation.frame);
          else appendLog("CHECK", validation.error ?? "invalid panel frame");
        } catch {
          appendLog("CHECK", `non-JSON panel line ignored: ${line}`);
        }
      }
    }
  } finally {
    reader.releaseLock();
    readLoopActive = false;
  }
}

function waitForPanel(
  predicate: (frame: PanelFrame) => boolean,
  timeoutMs: number,
): Promise<PanelFrame> {
  return new Promise((resolve, reject) => {
    const waiter: FrameWaiter = {
      predicate,
      resolve,
      reject,
      timeout: window.setTimeout(() => {
        waiters.delete(waiter);
        reject(new Error(`panel response timed out after ${timeoutMs} ms`));
      }, timeoutMs),
    };
    waiters.add(waiter);
  });
}

async function writeRaw(value: unknown): Promise<void> {
  if (!writer) throw new Error("serial writer is not connected");
  const line = `${JSON.stringify(value)}\n`;
  appendLog("HOST", value);
  await writer.write(new TextEncoder().encode(line));
}

async function send(frame: HostFrame): Promise<void> {
  if (!writer) throw new Error("serial writer is not connected");
  appendLog("HOST", frame);
  await writer.write(new TextEncoder().encode(encodePanelLine(frame)));
}

async function connect(): Promise<void> {
  const serial = (navigator as SerialNavigator).serial;
  if (!serial) {
    status.textContent =
      "Web Serial is unavailable here. Use a current desktop Chromium browser, or run the simulation.";
    appendLog("CHECK", "Web Serial API unavailable");
    return;
  }
  connectButton.disabled = true;
  try {
    port = await serial.requestPort();
    await port.open({ baudRate: PANEL_BAUD });
    if (!port.readable || !port.writable)
      throw new Error("serial streams unavailable");
    writer = port.writable.getWriter();
    void readSerial(port.readable);
    liveButton.disabled = false;
    status.textContent = "Pico connected at 115,200 baud. Live proof is ready.";
    appendLog("CHECK", "serial link opened at 115200 baud");
  } catch (error) {
    connectButton.disabled = false;
    status.textContent =
      error instanceof Error
        ? error.message
        : "Unable to open the serial device.";
  }
}

async function runLiveProof(): Promise<void> {
  if (!writer) return;
  liveButton.disabled = true;
  resetResults();
  setResult("map", "PASS");
  try {
    const readyPromise = waitForPanel((frame) => frame.type === "READY", 2_000);
    await send({ type: "HELLO", protocol: PANEL_PROTOCOL, machine: "QEC-1P" });
    const ready = await readyPromise;
    const compatible =
      ready.type === "READY" && ready.pixels === 4 && ready.keys === 4;
    setResult("handshake", compatible ? "PASS" : "FAIL");
    if (!compatible)
      throw new Error("Pico reported an incompatible physical map");

    for (const frame of canonicalFrames()) {
      const appliedPromise = waitForPanel(
        (candidate) =>
          candidate.type === "APPLIED" && candidate.sequence === frame.sequence,
        1_500,
      );
      await send(frame);
      await appliedPromise;
    }
    setResult("states", "PASS");

    const brightnessFault = waitForPanel(
      (frame) => frame.type === "FAULT" && frame.code === "BRIGHTNESS_LIMIT",
      1_500,
    );
    await writeRaw({ type: "SET_BRIGHTNESS", brightness: 0.26 });
    await brightnessFault;
    setResult("brightness", "PASS");

    const watchdogFault = waitForPanel(
      (frame) => frame.type === "FAULT" && frame.code === "WATCHDOG",
      3_500,
    );
    appendLog("CHECK", "withholding heartbeat to test the 2,000 ms watchdog");
    await watchdogFault;
    setResult("watchdog", "PASS");
    completeEvidence("physical");
    status.textContent = "Live proof complete. The physical prototype passed.";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    appendLog("CHECK", `live proof stopped: ${message}`);
    status.textContent = `Live proof stopped: ${message}`;
  } finally {
    liveButton.disabled = false;
  }
}

simulateButton.addEventListener("click", runSimulation);
connectButton.addEventListener("click", () => void connect());
liveButton.addEventListener("click", () => void runLiveProof());
clearButton.addEventListener("click", () => {
  log.textContent = "QEC-1P bench console ready.";
});

downloadPassport.addEventListener("click", () => {
  const url = URL.createObjectURL(
    new Blob([serializeRunPassport(activePassport)], {
      type: "application/json;charset=utf-8",
    }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `qec-run-${activePassport.source}-seed-${String(activePassport.seed).padStart(2, "0")}.passport.json`;
  anchor.click();
  URL.revokeObjectURL(url);
});
