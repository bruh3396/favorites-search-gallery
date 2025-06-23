import { EMPTY_FAVORITES_PAGINATION_PARAMETERS, FavoritesPaginationParameters } from "../../types/favorite_pagination_parameters";
import { Events } from "../../../../lib/global/events/events";
import { FavoritesPageRelation } from "../../types/favorite/favorite_types";
import { FavoritesSettings } from "../../../../config/favorites_settings";
import { ON_DESKTOP_DEVICE } from "../../../../lib/global/flags/intrinsic_flags";
import { Preferences } from "../../../../store/local_storage/preferences";
import { getNumbersAround } from "../../../../utils/collection/array";
import { insertStyleHTML } from "../../../../utils/dom/style";
import { isOnlyDigits } from "../../../../utils/primitive/string";

const CONTAINER = createContainer();
const RANGE_INDICATOR = document.createElement("label");

RANGE_INDICATOR.id = "pagination-range-label";

function createContainer(): HTMLSpanElement {
  const menu = document.createElement("span");

  menu.id = "favorites-pagination-container";
  return menu;
}

function insertMenu(): void {
  if (ON_DESKTOP_DEVICE) {
    const placeToInsert = document.getElementById("favorites-pagination-placeholder");

    if (placeToInsert !== null) {
      placeToInsert.insertAdjacentElement("afterend", CONTAINER);
      placeToInsert.remove();
    }
    return;
  }
  const footerBottom = document.getElementById("mobile-footer-bottom");

  if (footerBottom !== null) {
    footerBottom.insertAdjacentElement("afterbegin", CONTAINER);
  }
}

function insert(): void {
  const matchCountLabel = document.getElementById("match-count-label");

  if (matchCountLabel !== null) {
    matchCountLabel.insertAdjacentElement("afterend", RANGE_INDICATOR);
  }
  insertMenu();
}

export function create(parameters: FavoritesPaginationParameters): void {
  CONTAINER.innerHTML = "";
  updateRangeIndicator(parameters.startIndex, parameters.endIndex, parameters.favoritesCount);
  createNumberTraversalButtons(parameters.currentPageNumber, parameters.finalPageNumber);
  createArrowTraversalButtons(parameters);
  createGotoSpecificPageInputs(parameters.finalPageNumber);
}

export function update(parameters: FavoritesPaginationParameters): void {
  const atMaxPageNumberButtons = document.getElementsByClassName("pagination-number").length >= FavoritesSettings.maxPageNumberButtons;

  if (atMaxPageNumberButtons) {
    return;
  }
  create(parameters);
}

function updateRangeIndicator(start: number, end: number, count: number): void {
  end = Math.min(count, end);
  RANGE_INDICATOR.textContent = end === 0 ? "" : `${start + 1} - ${end}`;
}

function createNumberTraversalButtons(currentPageNumber: number, finalPageNumber: number): void {
  const pageNumbers = getNumbersAround(currentPageNumber, FavoritesSettings.maxPageNumberButtons, 1, finalPageNumber);

  for (const pageNumber of pageNumbers) {
    createNumberTraversalButton(currentPageNumber, pageNumber);
  }
}

function createNumberTraversalButton(currentPageNumber: number, pageNumber: number): void {
  const button = document.createElement("button");
  const selected = currentPageNumber === pageNumber;

  button.id = `favorites-page-${pageNumber}`;
  button.title = `Goto page ${pageNumber}`;
  button.className = "pagination-number";
  button.classList.toggle("selected", selected);
  button.onclick = (): void => {
    Events.favorites.pageSelected.emit(pageNumber);
  };
  CONTAINER.appendChild(button);
  button.textContent = String(pageNumber);
}

function createArrowTraversalButtons(parameters: FavoritesPaginationParameters): void {
  const previous = createArrowTraversalButton("previous", "<", "afterbegin");
  const first = createArrowTraversalButton("first", "<<", "afterbegin");
  const next = createArrowTraversalButton("next", ">", "beforeend");
  const final = createArrowTraversalButton("final", ">>", "beforeend");

  updateArrowTraversalButtonInteractability(previous, first, next, final, parameters);
}

function createArrowTraversalButton(name: FavoritesPageRelation, textContent: string, position: InsertPosition): HTMLButtonElement {
  const button = document.createElement("button");

  button.id = `${name}-page`;
  button.title = `Goto ${name} page`;
  button.textContent = textContent;
  button.onclick = (): void => {
    Events.favorites.relativePageSelected.emit(name);
  };
  CONTAINER.insertAdjacentElement(position, button);
  return button;
}

function createGotoSpecificPageInputs(finalPageNumber: number): void {
  if (finalPageNumber === 1) {
    return;
  }
  const container = document.createElement("span");
  const input = document.createElement("input");
  const button = document.createElement("button");

  container.title = "Goto specific page";
  input.type = "number";
  input.placeholder = "#";
  input.id = "goto-page-input";
  button.textContent = "Go";
  button.id = "goto-page-button";
  button.onclick = (): void => {
    if (isOnlyDigits(input.value)) {
      Events.favorites.pageSelected.emit(Number(input.value));
    }
  };
  input.onkeydown = (event): void => {
    if (event.key === "Enter") {
      button.click();
    }
  };
  container.appendChild(input);
  container.appendChild(button);
  CONTAINER.appendChild(container);
}

function updateArrowTraversalButtonInteractability(previousPage: HTMLButtonElement, firstPage: HTMLButtonElement, nextPage: HTMLButtonElement, finalPage: HTMLButtonElement, parameters: FavoritesPaginationParameters): void {
  if (parameters.currentPageNumber === 1) {
    previousPage.disabled = true;
    firstPage.disabled = true;
  }

  if (parameters.currentPageNumber === parameters.finalPageNumber) {
    nextPage.disabled = true;
    finalPage.disabled = true;
  }
}

export function toggle(value: boolean): void {
  const html = `
      #favorites-pagination-container,
      #results-per-page-container,
      #favorite-finder,
      #pagination-range-label
      {
        display: none !important;
      }
    `;

  insertStyleHTML(value ? "" : html, "pagination-menu-enable");
}

export function getContainer(): HTMLElement {
  return CONTAINER;
}

export function setupFavoritesPaginationMenu(): void {
  insert();
  create(EMPTY_FAVORITES_PAGINATION_PARAMETERS);
  toggle(!Preferences.infiniteScrollEnabled.value);
}
