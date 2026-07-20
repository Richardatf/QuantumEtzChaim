import Ajv2020 from "ajv/dist/2020.js";
import build from "../specifications/qec-build-v0.3.json";
import paths from "../specifications/qec-paths-v0.3.json";
import buildSchema from "../specifications/schemas/build-contract-v0.3.schema.json";
import pathSchema from "../specifications/schemas/path-map-v0.3.schema.json";
import traceSchema from "../specifications/schemas/trace-v0.3.schema.json";
import trace00 from "../tests/fixtures/golden-traces/or-seed-00.json";
import trace05 from "../tests/fixtures/golden-traces/or-seed-05.json";
import trace09 from "../tests/fixtures/golden-traces/or-seed-09.json";
import trace13 from "../tests/fixtures/golden-traces/or-seed-13.json";
import trace21 from "../tests/fixtures/golden-traces/or-seed-21.json";

const trace = trace09;
const goldenTraces = [trace00, trace05, trace09, trace13, trace21];
const byId = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const requirements = byId<HTMLDivElement>("requirements"),
  gates = byId<HTMLDivElement>("gates"),
  routes = byId<HTMLTableSectionElement>("paths"),
  events = byId<HTMLDivElement>("trace"),
  validation = byId<HTMLDivElement>("validation"),
  statuses = byId<HTMLDivElement>("schema-status"),
  downloads = byId<HTMLDivElement>("downloads");
const items = [
  `Radix ${build.machine.radix}`,
  `${build.machine.visibleRegisters}+${build.machine.hiddenRegisters} registers`,
  `Seed ${build.determinism.canonicalSeed}`,
  `${build.limits.instructions} instructions max`,
  `${build.limits.traceEvents.toLocaleString()} trace events`,
  `${(build.limits.exportBytes / 1048576).toFixed(0)} MiB export cap`,
  ...build.invariants,
];
items.forEach((value) => {
  const node = document.createElement("div");
  node.className = "chip";
  node.textContent = value;
  requirements.append(node);
});
build.verificationGates.forEach((value) => {
  const node = document.createElement("div");
  node.className = "chip";
  node.textContent = `✓ ${value}`;
  gates.append(node);
});
paths.paths.forEach((path, index) => {
  const row = routes.insertRow();
  [
    String(index + 1).padStart(2, "0"),
    path.letter,
    `${path.source} → ${path.destination}`,
    path.operation,
    path.transform.id,
    path.services.join(" · "),
  ].forEach((value, i) => {
    const cell = row.insertCell();
    cell.innerHTML = i === 4 ? `<code>${value}</code>` : value;
  });
});
trace.events.forEach((event) => {
  const node = document.createElement("article");
  node.className = "event";
  node.innerHTML = `<b>${String(event.sequence).padStart(2, "0")}</b><strong lang="he">${event.letter}</strong><div><code>${event.transform}</code><br><small>${event.route.join(" → ")} · ${event.services.join(" / ")}</small></div><span class="hash">${event.beforeHash} → ${event.afterHash}</span>`;
  events.append(node);
});
const ajv = new Ajv2020({ allErrors: true, strict: true });
const checks = [
  { name: "Build contract", schema: buildSchema, data: build },
  { name: "22-path map", schema: pathSchema, data: paths },
  ...goldenTraces.map((item) => ({
    name: `Golden trace seed ${String(item.seed).padStart(2, "0")}`,
    schema: traceSchema,
    data: item,
  })),
];
checks.forEach((check) => {
  const ok = ajv.validate(check.schema, check.data);
  const row = document.createElement("p");
  row.className = ok ? "valid" : "invalid";
  row.textContent = `${ok ? "PASS" : "FAIL"} / ${check.name}${ok ? "" : ` / ${ajv.errors?.map((e) => e.instancePath + " " + e.message).join("; ")}`}`;
  validation.append(row);
  const badge = document.createElement("span");
  badge.textContent = `${ok ? "VALID" : "INVALID"} · ${check.name}`;
  statuses.append(badge);
});
const artifacts = [
  { label: "Build contract", data: build, file: "qec-build-v0.3.json" },
  { label: "Path map", data: paths, file: "qec-paths-v0.3.json" },
  ...goldenTraces.map((item) => ({
    label: `Trace seed ${String(item.seed).padStart(2, "0")}`,
    data: item,
    file: `qec-or-seed-${String(item.seed).padStart(2, "0")}.trace.json`,
  })),
];
artifacts.forEach((item) => {
  const button = document.createElement("button");
  button.textContent = `Download ${item.label}`;
  button.onclick = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(item.data, null, 2) + "\n"], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = item.file;
    a.click();
    URL.revokeObjectURL(url);
  };
  downloads.append(button);
});
