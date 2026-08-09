import { IconName, icon } from "@/lib/ui/icon";
import { Stepper, buildStepper } from "@/lib/ui/settings/components/stepper_control";
import { label, span } from "@/utils/dom/element_factory";
import { removeDataset, toggleDataset } from "@/utils/dom/dataset";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { NavigationKey } from "@/types/input";
import { ON_DESKTOP_DEVICE } from "@/lib/environment";
import { PaginationContext } from "@/features/favorites/types/types";
import { PaginationSequence } from "@/types/ui";
import { Preferences } from "@/app/context/preferences";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { doNothing } from "@/utils/function";
import { insertStyle } from "@/utils/dom/injector";
import { paginationUpdateStrategy } from "@/lib/ui/pagination";

const container = span("favorites-pagination");
const rangeIndicator = label("pagination-range-label");

let onPageSelected: (pageNumber: number) => void = doNothing;
let onPageStepped: (direction: NavigationKey) => void = doNothing;
let renderedSequence: PaginationSequence = [];
let gotoPageStepper: Stepper | null = null;

export function setup(pageSelected: (pageNumber: number) => void, pageStepped: (direction: NavigationKey) => void): void {
  onPageSelected = pageSelected;
  onPageStepped = pageStepped;
  insert();
  buildPaginator({currentPage: 1, finalPage: 1, totalCount: 0, sliceStart: 0, sliceEnd: 0, sequence: [1]});
  togglePaginator(!Preferences.favorites.infiniteScroll.value);
}

export function togglePaginator(value: boolean): void {
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

export function getPaginationContainer(): HTMLElement {
  return container;
}

export function isGotoPagePopoverTarget(target: Node): boolean {
  const popover = container.querySelector("#goto-page-popover");
  const ellipsis = container.querySelector(".favorites-pagination-ellipsis");
  return popover?.contains(target) === true || ellipsis?.contains(target) === true;
}

export function closeGotoPagePopover(): void {
  removeDataset(container.querySelector<HTMLElement>("#goto-page-popover"), "open");
}

export function buildPaginator(context: PaginationContext): void {
  container.innerHTML = "";
  updateRangeIndicator(context.sliceStart, context.sliceEnd, context.totalCount);
  createNumberTraversalButtons(context);
  createArrowTraversalButtons(context);
}

export function updatePaginator(context: PaginationContext): void {
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
  addTooltip(ellipsis, "Goto specific page", "below");
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

  button.className = "favorites-pagination-btn";
  container.appendChild(button);
  assignNumberTraversalButton(button, currentPageNumber, pageNumber);
}

function assignNumberTraversalButton(button: HTMLButtonElement, currentPageNumber: number, pageNumber: number): void {
  button.id = `favorites-page-${pageNumber}`;
  button.classList.toggle("selected", currentPageNumber === pageNumber);
  button.textContent = String(pageNumber);
  button.onclick = (): void => {
    onPageSelected(pageNumber);
  };
}

function rebuildNumberTraversalButtons(context: PaginationContext): void {
  const strategy = paginationUpdateStrategy(renderedSequence, context.sequence);

  if (strategy === "skip") {
    return;
  }

  if (strategy === "patch") {
    patchNumberTraversalButtons(context);
    return;
  }

  for (const element of [...container.querySelectorAll(".favorites-pagination-btn, .favorites-pagination-ellipsis, #goto-page-popover")]) {
    element.remove();
  }
  createNumberTraversalButtons(context);
}

function patchNumberTraversalButtons(context: PaginationContext): void {
  const buttons = container.querySelectorAll<HTMLButtonElement>(".favorites-pagination-btn");
  let buttonIndex = 0;

  for (const term of context.sequence) {
    if (term !== "ellipsis") {
      const button = buttons[buttonIndex];

      if (button !== undefined) {
        assignNumberTraversalButton(button, context.currentPage, term);
      }
      buttonIndex += 1;
    }
  }
  patchGotoPagePopover(context);
  renderedSequence = context.sequence;
}

function patchGotoPagePopover(context: PaginationContext): void {
  gotoPageStepper?.setMax(context.finalPage);
}

function createArrowTraversalButtons(context: PaginationContext): void {
  const previous = createArrowTraversalButton("previous", "ArrowLeft", "chevronLeft", "afterbegin");
  const next = createArrowTraversalButton("next", "ArrowRight", "chevronRight", "beforeend");

  updateArrowTraversalButtonInteractability(previous, next, context);
}

function createArrowTraversalButton(name: string, direction: NavigationKey, iconName: IconName, position: InsertPosition): HTMLButtonElement {
  const button = document.createElement("button");

  button.id = `${name}-page`;
  addTooltip(button, `Goto ${name} page`, "below");
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
  const button = document.createElement("button");
  const stepper = buildStepper({
    id: "goto-page-input",
    min: 1,
    max: finalPageNumber,
    step: 1,
    value: currentPageNumber,
    onChange: doNothing
  });

  popover.id = "goto-page-popover";
  heading.className = "goto-page-heading";
  heading.textContent = "Go to page";
  row.id = "goto-page-row";
  button.textContent = "Go";
  button.id = "goto-page-button";
  gotoPageStepper = stepper;

  const submit = (): void => {
    onPageSelected(stepper.value);
    removeDataset(popover, "open");
  };

  button.onclick = submit;
  stepper.element.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      submit();
    }
  });

  row.append(stepper.element, button);
  popover.append(heading, row);
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
