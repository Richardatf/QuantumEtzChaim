import { compileIvritToOpenQasm, IVRIT_OPENQASM_GATES } from "./openqasm.js";
const sourceInput = document.querySelector<HTMLInputElement>("#qasm-source")!;
const qasmOutput = document.querySelector<HTMLElement>("#qasm-output")!;
const qasmStatus = document.querySelector<HTMLElement>("#qasm-status")!;
const compileButton =
  document.querySelector<HTMLButtonElement>("#compile-qasm")!;
const qasmMap = document.querySelector<HTMLElement>("#qasm-map")!;

IVRIT_OPENQASM_GATES.forEach((gate) => {
  const item = document.createElement("li");
  item.innerHTML = `<b lang="he">${gate.letter}</b><code>${gate.operation}</code>`;
  item.title = `${gate.label} / arity ${gate.arity}`;
  qasmMap.append(item);
});

function renderQasm() {
  try {
    const source = sourceInput.value.trim();
    qasmOutput.textContent = compileIvritToOpenQasm(source, 3);
    qasmStatus.textContent =
      "Projection generated; not executed. External validation covers the published corpus.";
    qasmStatus.dataset.state = "valid";
  } catch (error) {
    qasmOutput.textContent = "";
    qasmStatus.textContent =
      error instanceof Error ? error.message : String(error);
    qasmStatus.dataset.state = "invalid";
  }
}
compileButton.addEventListener("click", renderQasm);
sourceInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") renderQasm();
});
renderQasm();
