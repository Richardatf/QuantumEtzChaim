export {};

// Keep previously shared homepage research anchors useful after the material
// moves to its dedicated page. Other pages and unknown hashes stay untouched.
const overviewPaths = new Set(["/", "/index.html", "/index"]);
const researchAnchors = new Set([
  "#why-openqasm",
  "#bridge",
  "#quantum-target",
  "#help",
  "#evidence",
  "#join",
]);
if (
  overviewPaths.has(window.location.pathname) &&
  researchAnchors.has(window.location.hash)
) {
  window.location.replace(
    new URL(`research.html${window.location.hash}`, window.location.href),
  );
}

const header = document.querySelector<HTMLElement>("[data-site-header]");
const menu = header?.querySelector<HTMLButtonElement>("[data-menu-toggle]");
const navigation = header?.querySelector<HTMLElement>("#primary-nav");

if (header && menu && navigation) {
  header.classList.add("is-enhanced");
  menu.hidden = false;
  const closeMenu = (restoreFocus = false) => {
    navigation.dataset.open = "false";
    menu.setAttribute("aria-expanded", "false");
    menu.textContent = "Menu";
    if (restoreFocus) menu.focus();
  };
  menu.addEventListener("click", () => {
    const open = navigation.dataset.open !== "true";
    navigation.dataset.open = String(open);
    menu.setAttribute("aria-expanded", String(open));
    menu.textContent = open ? "Close menu" : "Menu";
  });
  header.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navigation.dataset.open === "true") {
      event.preventDefault();
      closeMenu(true);
    }
  });
  navigation.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a"))
      closeMenu();
  });
  document.addEventListener("click", (event) => {
    if (event.target instanceof Node && !header.contains(event.target))
      closeMenu();
  });
  window
    .matchMedia("(min-width: 1121px)")
    .addEventListener("change", () => closeMenu());
}
