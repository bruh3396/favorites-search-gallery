import { IconName, icon } from "@/lib/ui/icon";
import { label, span } from "@/utils/dom/element";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesMenuId } from "@/features/favorites/types/scaffold";
import { FavoritesPaginationParameters } from "@/features/favorites/types/favorite_types";
import { ON_DESKTOP_DEVICE } from "@/lib/environment";
import { PageRelation } from "@/types/favorite";
import { Preferences } from "@/app/context/preferences";
import { doNothing } from "@/utils/function";
import { insertStyle } from "@/utils/dom/injector";
import { isOnlyDigits } from "@/utils/string/query";
import { numbersAroundInRange } from "@/utils/number";
import { toggleDataset } from "@/utils/dom/attribute";

const mainContainer = span("favorites-pagination-container");
const rangeIndicator = label("pagination-range-label");
const pageNumberRegex = /favorites-page-(\d+)/;

let onPageSelected: (pageNumber: number) => void = doNothing;
let onRelativePageSelected: (relation: PageRelation) => void = doNothing;

export function setup(pageSelected: (pageNumber: number) => void, relativePageSelected: (relation: PageRelation) => void): void {
  onPageSelected = pageSelected;
  onRelativePageSelected = relativePageSelected;
  insert();
  build({currentPageNumber: 1, finalPageNumber: 1, favoritesCount: 0, startIndex: 0, endIndex: 0});
  toggle(!Preferences.favoritesInfiniteScroll.value);
}

export function toggle(value: boolean): void {
  const html = `
      #favorites-pagination-container,
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
  return mainContainer;
}

export function build(parameters: FavoritesPaginationParameters): void {
  mainContainer.innerHTML = "";
  updateRangeIndicator(parameters.startIndex, parameters.endIndex, parameters.favoritesCount);
  createNumberTraversalButtons(parameters.currentPageNumber, parameters.finalPageNumber);
  createArrowTraversalButtons(parameters);
}

export function update(parameters: FavoritesPaginationParameters): void {
  const pageNumberButtons = Array.from(document.getElementsByClassName("favorites-pagination-btn"));
  const atMaxPageNumberButtons = pageNumberButtons.length >= FavoritesConfig.maxPageNumberButtons;

  if (!atMaxPageNumberButtons) {
    build(parameters);
    return;
  }
  const middlePageNumberButton = pageNumberButtons[Math.floor(pageNumberButtons.length / 2)];

  if (!(middlePageNumberButton instanceof HTMLElement)) {
    build(parameters);
    return;
  }
  const middlePageNumberMatch = pageNumberRegex.exec(middlePageNumberButton.id);

  if (middlePageNumberMatch === null) {
    build(parameters);
    return;
  }
  const middlePageNumber = parseInt(middlePageNumberMatch[1], 10);

  if (parameters.currentPageNumber <= middlePageNumber) {
    return;
  }
  build(parameters);
}

function insertMenu(): void {
  if (ON_DESKTOP_DEVICE) {
    const placeToInsert = document.getElementById(FavoritesMenuId.paginationSlot);

    if (placeToInsert !== null) {
      placeToInsert.insertAdjacentElement("afterend", mainContainer);
      placeToInsert.remove();
    }
    return;
  }
  const footerBottom = document.getElementById("mobile-footer-bottom");

  if (footerBottom !== null) {
    footerBottom.insertAdjacentElement("afterbegin", mainContainer);
  }
}

function insert(): void {
  const matchCountLabel = document.getElementById(FavoritesMenuId.matchCount);

  if (matchCountLabel !== null) {
    matchCountLabel.insertAdjacentElement("afterend", rangeIndicator);
  }
  insertMenu();
}

function updateRangeIndicator(start: number, end: number, count: number): void {
  end = Math.min(count, end);
  rangeIndicator.textContent = end === 0 ? "" : `${start + 1} - ${end}`;
}

function createNumberTraversalButtons(currentPageNumber: number, finalPageNumber: number): void {
  const popover = createGotoPagePopover(currentPageNumber, finalPageNumber);
  const windowPages = numbersAroundInRange(currentPageNumber, FavoritesConfig.maxPageNumberButtons, 1, finalPageNumber);
  const windowStart = windowPages[0] ?? 1;
  const windowEnd = windowPages[windowPages.length - 1] ?? 1;

  if (windowStart > 1) {
    createNumberTraversalButton(currentPageNumber, 1);
  }

  if (windowStart > 2) {
    createEllipsis(popover);
  }

  for (const pageNumber of windowPages) {
    createNumberTraversalButton(currentPageNumber, pageNumber);
  }

  if (windowEnd < finalPageNumber - 1) {
    createEllipsis(popover);
  }

  if (windowEnd < finalPageNumber) {
    createNumberTraversalButton(currentPageNumber, finalPageNumber);
  }
  mainContainer.appendChild(popover);
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
  mainContainer.appendChild(ellipsis);
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
  mainContainer.appendChild(button);
  button.textContent = String(pageNumber);
}

function createArrowTraversalButtons(parameters: FavoritesPaginationParameters): void {
  const previous = createArrowTraversalButton("previous", "chevronLeft", "afterbegin");
  const next = createArrowTraversalButton("next", "chevronRight", "beforeend");

  updateArrowTraversalButtonInteractability(previous, next, parameters);
}

function createArrowTraversalButton(name: PageRelation, iconName: IconName, position: InsertPosition): HTMLButtonElement {
  const button = document.createElement("button");

  button.id = `${name}-page`;
  button.title = `Goto ${name} page`;
  button.className = "favorites-pagination-arrow";
  button.appendChild(icon(iconName));
  button.onclick = (): void => {
    onRelativePageSelected(name);
  };
  mainContainer.insertAdjacentElement(position, button);
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

function updateArrowTraversalButtonInteractability(previousPage: HTMLButtonElement, nextPage: HTMLButtonElement, parameters: FavoritesPaginationParameters): void {
  previousPage.disabled = parameters.currentPageNumber === 1;
  nextPage.disabled = parameters.currentPageNumber === parameters.finalPageNumber;
}
