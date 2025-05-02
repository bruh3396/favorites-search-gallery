import {EMPTY_FAVORITES_PAGINATION_PARAMETERS, FavoritesPaginationParameters} from "../types/favorite_pagination_parameters";
import {Events} from "../../../lib/functional/events";
import {FavoritesSettings} from "../../../config/favorites_settings";
import {Preferences} from "../../../store/preferences/preferences";
import {getNumbersAround} from "../../../utils/collection/array";
import {insertStyleHTML} from "../../../utils/dom/style";
import {isOnlyDigits} from "../../../utils/primitive/string";

const CONTAINER = createContainer();
const RANGE_INDICATOR = createRangeIndicator();

function createRangeIndicator(): HTMLElement {
  const rangeIndicator = document.createElement("label");
  const parent = document.getElementById("match-count-label");

  if (parent !== null) {
    parent.insertAdjacentElement("afterend", rangeIndicator);
  }
  rangeIndicator.id = "pagination-range-label";
  return rangeIndicator;
}

function createContainer(): HTMLSpanElement {
  const menu = document.createElement("span");

  menu.id = "favorites-pagination-container";
  return menu;
}

function insert(): void {
  const placeToInsertMenu = document.getElementById("favorites-pagination-placeholder");

  if (placeToInsertMenu !== null) {
    placeToInsertMenu.insertAdjacentElement("afterend", CONTAINER);
    placeToInsertMenu.remove();
  }
}

export function create(parameters: FavoritesPaginationParameters): void {
  CONTAINER.innerHTML = "";
  updateRangeIndicator(parameters.startIndex, parameters.endIndex);
  createNumberTraversalButtons(parameters.currentPageNumber, parameters.finalPageNumber);
  createArrowTraversalButtons(parameters);
  createGotoSpecificPageInputs(parameters.finalPageNumber);
}

/**
 * @param {FavoritesPaginationParameters} parameters
 */
export function update(parameters: FavoritesPaginationParameters): void {
  const atMaxPageNumberButtons = document.getElementsByClassName("pagination-number").length >= FavoritesSettings.maxPageNumberButtons;

  if (atMaxPageNumberButtons) {
    return;
  }
  create(parameters);
}

function updateRangeIndicator(start: number, end: number): void {
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

function createArrowTraversalButton(name: string, textContent: string, position: InsertPosition): HTMLButtonElement {
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

/**
 * @param {Number} finalPageNumber
 */
function createGotoSpecificPageInputs(finalPageNumber: number): void {
  if (pageNumberTraversalButtonExists(1) && pageNumberTraversalButtonExists(finalPageNumber)) {
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

function pageNumberTraversalButtonExists(finalPageNumber: number): boolean {
  return document.getElementById(`favorites-page-${finalPageNumber}`) !== null;
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
  toggle(!Preferences.infiniteScroll.value);
}
