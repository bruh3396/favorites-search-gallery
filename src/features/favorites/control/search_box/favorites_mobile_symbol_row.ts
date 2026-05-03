import { sleep } from "../../../../lib/core/scheduling/promise";

const SYMBOLS = ["-", "*", "_", "(", ")", "~"];
const CONTAINER_ID = "mobile-symbol-container";
const PARENT_ID = "left-favorites-panel";
const ACTIVE_CLASS = "active";
const BUTTON_BLUR_DELAY_MS = 0;
const SEARCH_BLUR_DELAY_MS = 10;

export function setupMobileSymbolRow(searchBox: HTMLInputElement): void {
  const parent = document.getElementById(PARENT_ID);

  if (parent === null) {
    return;
  }
  const container = buildSymbolRow();

  parent.insertAdjacentElement("afterbegin", container);
  wireButtons(container, searchBox);
  wireSearchBoxFocus(container, searchBox);
}

function buildSymbolRow(): HTMLElement {
  const container = document.createElement("div");

  container.id = CONTAINER_ID;
  container.innerHTML = SYMBOLS.map(s => `<button>${s}</button>`).join("");
  return container;
}

function wireButtons(container: HTMLElement, searchBox: HTMLInputElement): void {
  for (const button of Array.from(container.querySelectorAll("button"))) {
    button.addEventListener("click", () => insertSymbolAtCursor(searchBox, button.textContent ?? ""), { passive: true });
    button.addEventListener("blur", () => hideAfterFocusSettles(container, BUTTON_BLUR_DELAY_MS));
  }
}

function wireSearchBoxFocus(container: HTMLElement, searchBox: HTMLInputElement): void {
  searchBox.addEventListener("focus", () => container.classList.toggle(ACTIVE_CLASS, true), { passive: true });
  searchBox.addEventListener("blur", () => hideAfterFocusSettles(container, SEARCH_BLUR_DELAY_MS));
}

function insertSymbolAtCursor(searchBox: HTMLInputElement, symbol: string): void {
  const cursor = searchBox.selectionStart ?? 0;

  searchBox.value = searchBox.value.slice(0, cursor) + symbol + searchBox.value.slice(cursor);
  searchBox.selectionStart = cursor + 1;
  searchBox.selectionEnd = cursor + 1;
  searchBox.focus();
}

async function hideAfterFocusSettles(container: HTMLElement, delayMs: number): Promise<void> {
  await sleep(delayMs);

  if (!isFocusInsideRow(container)) {
    container.classList.toggle(ACTIVE_CLASS, false);
  }
}

function isFocusInsideRow(container: HTMLElement): boolean {
  const active = document.activeElement;

  if (active === null) {
    return false;
  }
  return active.id === "favorites-search-box" || container.contains(active);
}
