import { compileIvritToOpenQasm, IVRIT_OPENQASM_GATES } from "./openqasm.js";

function renderOpenQasm() {
  const input = document.querySelector<HTMLInputElement>("#qasm-source");
  const output = document.querySelector<HTMLElement>("#qasm-output");
  const status = document.querySelector<HTMLElement>("#qasm-status");
  if (!input || !output || !status) return;

  try {
    output.textContent = compileIvritToOpenQasm(input.value);
    status.textContent = "VALID OPENQASM 3 PROJECTION / NOT EXECUTED";
    status.dataset.state = "valid";
  } catch (error) {
    output.textContent =
      error instanceof Error ? error.message : "Invalid source";
    status.textContent = "PROJECTION REJECTED / NO CODE EMITTED";
    status.dataset.state = "invalid";
  }
}

const form = document.querySelector<HTMLFormElement>("#qasm-form");
form?.addEventListener("submit", (event) => {
  event.preventDefault();
  renderOpenQasm();
});

document
  .querySelector("#qasm-source")
  ?.addEventListener("input", renderOpenQasm);

const map = document.querySelector<HTMLElement>("#qasm-map");
if (map) {
  map.innerHTML = IVRIT_OPENQASM_GATES.map(
    ({ letter, operation, label }) =>
      `<li title="${label}"><b lang="he">${letter}</b><code>${operation}</code></li>`,
  ).join("");
}

renderOpenQasm();
