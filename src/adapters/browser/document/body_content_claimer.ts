export function claimBodyContent(): HTMLElement {
  overlayScrollbar();
  return document.body.appendChild(document.createElement("div"));
}

function overlayScrollbar(): void {
  document.documentElement.style.width = "100vw";
  document.body.style.overflowX = "clip";
}
