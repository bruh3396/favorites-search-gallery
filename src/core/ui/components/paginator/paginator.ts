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

const NEARBY_PAGE_COUNT = 5;

// WAI-ARIA pagination: a labelled nav landmark, the current page marked with aria-current.
export function createPaginator(ownerDocument: Document, { pageNumber, pageCount, onPageChange }: PaginatorOptions): Paginator {
  const element = ownerDocument.createElement("nav");
  const list = ownerDocument.createElement("ul");
  const previous = createStepButton(ownerDocument, { label: "Previous page", text: "‹" });
  const next = createStepButton(ownerDocument, { label: "Next page", text: "›" });

  element.className = PaginatorClass.root;
  element.setAttribute("aria-label", "Pagination");
  list.className = PaginatorClass.list;
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
    list.replaceChildren(...terms.map(term => createItem(ownerDocument, term, current)));
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

function createItem(ownerDocument: Document, term: PageTerm, current: number): HTMLLIElement {
  const item = ownerDocument.createElement("li");

  item.append(term === "gap" ? createGap(ownerDocument) : createPageButton(ownerDocument, term, current));
  return item;
}

function createPageButton(ownerDocument: Document, pageNumber: number, current: number): HTMLButtonElement {
  const button = ownerDocument.createElement("button");

  button.className = PaginatorClass.page;
  button.type = "button";
  button.textContent = String(pageNumber);
  button.dataset.pageNumber = String(pageNumber);

  if (pageNumber === current) {
    button.setAttribute("aria-current", "page");
  }
  return button;
}

function createGap(ownerDocument: Document): HTMLSpanElement {
  const gap = ownerDocument.createElement("span");

  gap.className = PaginatorClass.gap;
  gap.textContent = "…";
  gap.setAttribute("aria-hidden", "true");
  return gap;
}
