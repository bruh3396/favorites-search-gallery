import { PageTerm, getPageSequence } from "@/core/ui/components/paginator/page_sequence";
import { Readable, effect } from "@/core/utils/reactive/signal";

export const PaginatorClass = {
  root: "fsg-Paginator",
  list: "fsg-Paginator-list",
  step: "fsg-Paginator-step",
  page: "fsg-Paginator-page",
  gap: "fsg-Paginator-gap"
} as const;

export interface PaginatorOptions {
  pageNumber: Readable<number>;
  pageCount: Readable<number>;
  onPageChange: (pageNumber: number) => void;
}

export interface Paginator {
  readonly element: HTMLElement;
  dispose: () => void;
}

interface Slot {
  item: HTMLLIElement;
  button: HTMLButtonElement;
  gap: HTMLSpanElement;
}

const NEARBY_PAGE_COUNT = 5;
const SLOT_COUNT = NEARBY_PAGE_COUNT + 4;

// WAI-ARIA pagination: a labelled nav landmark, the current page marked with aria-current.
// The items are a fixed pool of slots patched in place, so a page change keeps the focused button.
export function createPaginator(ownerDocument: Document, { pageNumber, pageCount, onPageChange }: PaginatorOptions): Paginator {
  const element = ownerDocument.createElement("nav");
  const list = ownerDocument.createElement("ul");
  const previous = createStepButton(ownerDocument, { label: "Previous page", text: "‹" });
  const next = createStepButton(ownerDocument, { label: "Next page", text: "›" });
  const slots = Array.from({ length: SLOT_COUNT }, () => createSlot(ownerDocument));

  element.className = PaginatorClass.root;
  element.setAttribute("aria-label", "Pagination");
  list.className = PaginatorClass.list;
  list.append(...slots.map(slot => slot.item));
  element.append(previous, list, next);
  element.addEventListener("click", event => {
    const button = (event.target as Element).closest<HTMLButtonElement>("button[data-page-number]");

    if (button !== null && !button.disabled && !button.hasAttribute("aria-current")) {
      onPageChange(Number(button.dataset.pageNumber));
    }
  });

  const dispose = effect(() => {
    const current = pageNumber.value;
    const count = pageCount.value;
    const terms = getPageSequence({ pageNumber: current, pageCount: count, nearbyCount: NEARBY_PAGE_COUNT });

    element.hidden = count <= 1;
    showStep(previous, { pageNumber: current - 1, pageCount: count });
    showStep(next, { pageNumber: current + 1, pageCount: count });
    slots.forEach((slot, index) => showSlot(slot, terms[index], current));
  });
  return { element, dispose };
}

function createStepButton(ownerDocument: Document, { label, text }: { label: string; text: string }): HTMLButtonElement {
  const button = ownerDocument.createElement("button");

  button.className = PaginatorClass.step;
  button.type = "button";
  button.textContent = text;
  button.setAttribute("aria-label", label);
  return button;
}

function showStep(button: HTMLButtonElement, { pageNumber, pageCount }: { pageNumber: number; pageCount: number }): void {
  button.dataset.pageNumber = String(pageNumber);
  button.disabled = pageNumber < 1 || pageNumber > pageCount;
}

function createSlot(ownerDocument: Document): Slot {
  const item = ownerDocument.createElement("li");
  const button = ownerDocument.createElement("button");
  const gap = ownerDocument.createElement("span");

  button.className = PaginatorClass.page;
  button.type = "button";
  gap.className = PaginatorClass.gap;
  gap.textContent = "…";
  gap.setAttribute("aria-hidden", "true");
  item.append(button, gap);
  return { item, button, gap };
}

// A slot past the end of the sequence hides; a gap slot hides its button, so a stale page number is never visible or clickable.
function showSlot({ item, button, gap }: Slot, term: PageTerm | undefined, current: number): void {
  item.hidden = term === undefined;
  gap.hidden = term !== "gap";
  button.hidden = typeof term !== "number";

  if (typeof term === "number") {
    showPageButton(button, term, current);
  } else {
    button.removeAttribute("aria-current");
  }
}

function showPageButton(button: HTMLButtonElement, pageNumber: number, current: number): void {
  button.textContent = String(pageNumber);
  button.dataset.pageNumber = String(pageNumber);

  if (pageNumber === current) {
    button.setAttribute("aria-current", "page");
  } else {
    button.removeAttribute("aria-current");
  }
}
