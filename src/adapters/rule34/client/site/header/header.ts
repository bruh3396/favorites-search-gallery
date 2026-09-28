const HEADER_SELECTOR = "#header";

export function setHeaderVisible(visible: boolean): void {
  const header = document.querySelector<HTMLElement>(HEADER_SELECTOR);

  if (header !== null) {
    header.style.display = visible ? "" : "none";
  }
}
