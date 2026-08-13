import { IconName, icon } from "@/lib/ui/icon";
import { Stepper, buildStepper } from "@/lib/ui/settings/components/stepper_control";
import { createElement, label, span } from "@/utils/dom/element_factory";
import { removeDataset, toggleDataset } from "@/utils/dom/dataset";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { NavigationKey } from "@/types/input";
import { PaginationSequence } from "@/types/ui";
import { PaginationState } from "@/features/favorites/types/types";
import { Preferences } from "@/app/context/preferences";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { doNothing } from "@/utils/function";
import { paginationUpdateStrategy } from "@/lib/ui/pagination";

const PaginationSelectors = {
  containerId: "favorites-pagination",
  rangeIndicatorId: "pagination-range-label",
  numberTraversalButtonClass: "favorites-pagination-btn",
  ellipsisClass: "favorites-pagination-ellipsis",
  arrowClass: "favorites-pagination-arrow",
  headingClass: "goto-page-heading",
  selectedClass: "selected",
  popoverId: "goto-page-popover",
  popoverRowId: "goto-page-row",
  popoverInputId: "goto-page-input",
  popoverButtonId: "goto-page-button"
};

const ArrowTraversalButtons = {
  previous: { id: "previous-page", iconName: "chevronLeft", direction: "ArrowLeft", position: "afterbegin" },
  next: { id: "next-page", iconName: "chevronRight", direction: "ArrowRight", position: "beforeend" }
} as const satisfies Record<string, { id: string; iconName: IconName; direction: NavigationKey; position: InsertPosition }>;

const container = span(PaginationSelectors.containerId);
const rangeIndicator = label(PaginationSelectors.rangeIndicatorId);

let onPageSelected: (pageNumber: number) => void = doNothing;
let onPageStepped: (direction: NavigationKey) => void = doNothing;
let renderedSequence: PaginationSequence = [];
let gotoPageStepper: Stepper | null = null;

export function setup(pageSelected: (pageNumber: number) => void, pageStepped: (direction: NavigationKey) => void): void {
  onPageSelected = pageSelected;
  onPageStepped = pageStepped;
  insert();
  buildPaginator({ currentPage: 1, finalPage: 1, totalCount: 0, sliceStart: 0, sliceEnd: 0, sequence: [1] });
  togglePaginator(!Preferences.favorites.infiniteScroll.value);
}

export function togglePaginator(value: boolean): void {
  toggleDataset(document.documentElement, "paginationHidden", !value);
}

export function isGotoPagePopoverTarget(target: Node): boolean {
  const popover = container.querySelector(`#${PaginationSelectors.popoverId}`);
  const ellipsis = container.querySelector(`.${PaginationSelectors.ellipsisClass}`);
  return popover?.contains(target) === true || ellipsis?.contains(target) === true;
}

export function closeGotoPagePopover(): void {
  removeDataset(container.querySelector<HTMLElement>(`#${PaginationSelectors.popoverId}`), "open");
}

export function buildPaginator(context: PaginationState): void {
  container.innerHTML = "";
  updateRangeIndicator(context.sliceStart, context.sliceEnd, context.totalCount);
  createNumberTraversalButtons(context);
  createArrowTraversalButtons(context);
}

export function updatePaginator(context: PaginationState): void {
  updateRangeIndicator(context.sliceStart, context.sliceEnd, context.totalCount);
  rebuildNumberTraversalButtons(context);
  updateExistingArrowTraversalButtons(context);
}

function insertMenu(): void {
  const placeToInsert = document.getElementById(FavoritesId.paginationSlot);

  placeToInsert?.insertAdjacentElement("afterend", container);
  placeToInsert?.remove();
}

function insert(): void {
  document.getElementById(FavoritesId.resultsCount)?.insertAdjacentElement("beforebegin", rangeIndicator);
  insertMenu();
}

function updateRangeIndicator(start: number, end: number, count: number): void {
  end = Math.min(count, end);
  rangeIndicator.textContent = end === 0 ? "" : `${start + 1} - ${end}`;
}

function createNumberTraversalButtons(context: PaginationState): void {
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
  const ellipsis = createElement("button", { className: PaginationSelectors.ellipsisClass, textContent: "…" });

  addTooltip(ellipsis, "Goto specific page", "below");
  ellipsis.onclick = (): void => {
    if (toggleDataset(popover, "open")) {
      popover.querySelector("input")?.select();
    }
  };
  container.appendChild(ellipsis);
}

function createNumberTraversalButton(currentPageNumber: number, pageNumber: number): void {
  const button = createElement("button", { className: PaginationSelectors.numberTraversalButtonClass });

  container.appendChild(button);
  assignNumberTraversalButton(button, currentPageNumber, pageNumber);
}

function assignNumberTraversalButton(button: HTMLButtonElement, currentPageNumber: number, pageNumber: number): void {
  button.id = `favorites-page-${pageNumber}`;
  button.classList.toggle(PaginationSelectors.selectedClass, currentPageNumber === pageNumber);
  button.textContent = String(pageNumber);
  button.onclick = (): void => {
    onPageSelected(pageNumber);
  };
}

function rebuildNumberTraversalButtons(context: PaginationState): void {
  const strategy = paginationUpdateStrategy(renderedSequence, context.sequence);

  if (strategy === "skip") {
    return;
  }

  if (strategy === "patch") {
    patchNumberTraversalButtons(context);
    return;
  }

  for (const element of [...container.querySelectorAll(`.${PaginationSelectors.numberTraversalButtonClass}, .${PaginationSelectors.ellipsisClass}, #${PaginationSelectors.popoverId}`)]) {
    element.remove();
  }
  createNumberTraversalButtons(context);
}

function patchNumberTraversalButtons(context: PaginationState): void {
  const buttons = container.querySelectorAll<HTMLButtonElement>(`.${PaginationSelectors.numberTraversalButtonClass}`);
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

function patchGotoPagePopover(context: PaginationState): void {
  gotoPageStepper?.setMax(context.finalPage);
}

function createArrowTraversalButtons(context: PaginationState): void {
  const previous = createArrowTraversalButton("previous");
  const next = createArrowTraversalButton("next");

  updateArrowTraversalButtonInteractability(previous, next, context);
}

function createArrowTraversalButton(name: keyof typeof ArrowTraversalButtons): HTMLButtonElement {
  const arrow = ArrowTraversalButtons[name];
  const button = createElement("button", {
    id: arrow.id, className: PaginationSelectors.arrowClass, children: [icon(arrow.iconName)]
  });

  addTooltip(button, `Goto ${name} page`, "below");
  button.onclick = (): void => {
    onPageStepped(arrow.direction);
  };
  container.insertAdjacentElement(arrow.position, button);
  return button;
}

function createGotoPagePopover(currentPageNumber: number, finalPageNumber: number): HTMLElement {
  const heading = createElement("label", { className: PaginationSelectors.headingClass, textContent: "Go to page" });
  const button = createElement("button", { id: PaginationSelectors.popoverButtonId, textContent: "Go" });
  const stepper = buildStepper({
    id: PaginationSelectors.popoverInputId, min: 1, max: finalPageNumber, step: 1, value: currentPageNumber, onChange: doNothing
  });
  const row = createElement("div", { id: PaginationSelectors.popoverRowId, children: [stepper.element, button] });
  const popover = createElement("div", { id: PaginationSelectors.popoverId, children: [heading, row] });

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
  return popover;
}

function updateExistingArrowTraversalButtons(context: PaginationState): void {
  const previous = container.querySelector<HTMLButtonElement>(`#${ArrowTraversalButtons.previous.id}`);
  const next = container.querySelector<HTMLButtonElement>(`#${ArrowTraversalButtons.next.id}`);

  if (previous !== null && next !== null) {
    updateArrowTraversalButtonInteractability(previous, next, context);
  }
}

function updateArrowTraversalButtonInteractability(previousPage: HTMLButtonElement, nextPage: HTMLButtonElement, context: PaginationState): void {
  previousPage.disabled = context.currentPage === 1;
  nextPage.disabled = context.currentPage === context.finalPage;
}
