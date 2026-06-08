import { IconName, icon } from "@/lib/ui/icon";
import { PaginationContext, PaginationSequence } from "@/features/favorites/types/interfaces";
import { label, span } from "@/utils/dom/element";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { NavigationKey } from "@/types/input";
import { ON_DESKTOP_DEVICE } from "@/lib/environment";
import { Preferences } from "@/app/context/preferences";
import { doNothing } from "@/utils/function";
import { insertStyle } from "@/utils/dom/injector";
import { isOnlyDigits } from "@/utils/string/query";
import { toggleDataset } from "@/utils/dom/attribute";

const container = span("favorites-pagination");
const rangeIndicator = label("pagination-range-label");

let onPageSelected: (pageNumber: number) => void = doNothing;
let onPageStepped: (direction: NavigationKey) => void = doNothing;
let renderedSequence: PaginationSequence = [];

export function setup(pageSelected: (pageNumber: number) => void, pageStepped: (direction: NavigationKey) => void): void {
  onPageSelected = pageSelected;
  onPageStepped = pageStepped;
  insert();
  build({currentPage: 1, finalPage: 1, totalCount: 0, sliceStart: 0, sliceEnd: 0, sequence: [1]});
  toggle(!Preferences.favoritesInfiniteScroll.value);
}

export function toggle(value: boolean): void {
  const html = `
      #favorites-pagination,
      #results-per-page-container,
      #favorite-finder,
      #pagination-range-label,
      #favorites-bottom-navigation-buttons
      {
        display: none !important;
      }
    `;

  insertStyle(value ? "" : html, "fav-pagination-enable");
}

export function getContainer(): HTMLElement {
  return container;
}

export function build(context: PaginationContext): void {
  container.innerHTML = "";
  updateRangeIndicator(context.sliceStart, context.sliceEnd, context.totalCount);
  createNumberTraversalButtons(context);
  createArrowTraversalButtons(context);
}

export function update(context: PaginationContext): void {
  updateRangeIndicator(context.sliceStart, context.sliceEnd, context.totalCount);
  rebuildNumberTraversalButtons(context);
  updateExistingArrowTraversalButtons(context);
}

function insertMenu(): void {
  if (ON_DESKTOP_DEVICE) {
    const placeToInsert = document.getElementById(FavoritesId.paginationSlot);

    if (placeToInsert !== null) {
      placeToInsert.insertAdjacentElement("afterend", container);
      placeToInsert.remove();
    }
    return;
  }
  const footerBottom = document.getElementById("mobile-footer-bottom");

  if (footerBottom !== null) {
    footerBottom.insertAdjacentElement("afterbegin", container);
  }
}

function insert(): void {
  const matchCountLabel = document.getElementById(FavoritesId.matchCount);

  if (matchCountLabel !== null) {
    matchCountLabel.insertAdjacentElement("afterend", rangeIndicator);
  }
  insertMenu();
}

function updateRangeIndicator(start: number, end: number, count: number): void {
  end = Math.min(count, end);
  rangeIndicator.textContent = end === 0 ? "" : `${start + 1} - ${end}`;
}

function createNumberTraversalButtons(context: PaginationContext): void {
  const popover = createGotoPagePopover(context.currentPage, context.finalPage);

  renderedSequence = context.sequence;

  for (const term of renderedSequence) {
    if (term === "ellipsis") {
      createEllipsis(popover);
    } else {
      createNumberTraversalButton(context.currentPage, term);
    }
  }
  container.appendChild(popover);
}

function createEllipsis(popover: HTMLElement): void {
  const ellipsis = document.createElement("button");

  ellipsis.className = "favorites-pagination-ellipsis";
  ellipsis.title = "Goto specific page";
  ellipsis.textContent = "…";
  ellipsis.onclick = (): void => {
    if (toggleDataset(popover, "open")) {
      popover.querySelector("input")?.select();
    }
  };
  container.appendChild(ellipsis);
}

function createNumberTraversalButton(currentPageNumber: number, pageNumber: number): void {
  const button = document.createElement("button");
  const selected = currentPageNumber === pageNumber;

  button.id = `favorites-page-${pageNumber}`;
  button.className = "favorites-pagination-btn";
  button.classList.toggle("selected", selected);
  button.onclick = (): void => {
    onPageSelected(pageNumber);
  };
  container.appendChild(button);
  button.textContent = String(pageNumber);
}

function rebuildNumberTraversalButtons(context: PaginationContext): void {
  if (sequencesEqual(renderedSequence, context.sequence)) {
    return;
  }

  for (const element of [...container.querySelectorAll(".favorites-pagination-btn, .favorites-pagination-ellipsis, #goto-page-popover")]) {
    element.remove();
  }
  createNumberTraversalButtons(context);
}

function sequencesEqual(a: PaginationSequence, b: PaginationSequence): boolean {
  return a.length === b.length && a.every((term, index) => term === b[index]);
}

function createArrowTraversalButtons(context: PaginationContext): void {
  const previous = createArrowTraversalButton("previous", "ArrowLeft", "chevronLeft", "afterbegin");
  const next = createArrowTraversalButton("next", "ArrowRight", "chevronRight", "beforeend");

  updateArrowTraversalButtonInteractability(previous, next, context);
}

function createArrowTraversalButton(name: string, direction: NavigationKey, iconName: IconName, position: InsertPosition): HTMLButtonElement {
  const button = document.createElement("button");

  button.id = `${name}-page`;
  button.title = `Goto ${name} page`;
  button.className = "favorites-pagination-arrow";
  button.appendChild(icon(iconName));
  button.onclick = (): void => {
    onPageStepped(direction);
  };
  container.insertAdjacentElement(position, button);
  return button;
}

function createGotoPagePopover(currentPageNumber: number, finalPageNumber: number): HTMLElement {
  const popover = document.createElement("div");
  const heading = document.createElement("label");
  const row = document.createElement("div");
  const input = document.createElement("input");
  const button = document.createElement("button");

  popover.id = "goto-page-popover";
  heading.className = "goto-page-heading";
  heading.textContent = "Go to page";
  row.id = "goto-page-row";
  input.type = "number";
  input.min = "1";
  input.max = String(finalPageNumber);
  input.value = String(currentPageNumber);
  input.id = "goto-page-input";
  button.textContent = "Go";
  button.id = "goto-page-button";

  const submit = (): void => {
    if (isOnlyDigits(input.value)) {
      onPageSelected(Number(input.value));
      popover.classList.remove("goto-page-popover--open");
    }
  };

  button.onclick = submit;
  input.onkeydown = (event): void => {
    if (event.key === "Enter") {
      submit();
    }
  };

  row.appendChild(input);
  row.appendChild(button);
  popover.appendChild(heading);
  popover.appendChild(row);
  return popover;
}

function updateExistingArrowTraversalButtons(context: PaginationContext): void {
  const previous = container.querySelector<HTMLButtonElement>("#previous-page");
  const next = container.querySelector<HTMLButtonElement>("#next-page");

  if (previous !== null && next !== null) {
    updateArrowTraversalButtonInteractability(previous, next, context);
  }
}

function updateArrowTraversalButtonInteractability(previousPage: HTMLButtonElement, nextPage: HTMLButtonElement, context: PaginationContext): void {
  previousPage.disabled = context.currentPage === 1;
  nextPage.disabled = context.currentPage === context.finalPage;
}
