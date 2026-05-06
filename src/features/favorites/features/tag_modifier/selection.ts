import { Favorite } from "../../../../types/favorite";

const selected: Set<Favorite> = new Set();
let getSearchResults: () => Favorite[] = () => [];
let atLeastOneFavoriteIsSelected = false;

export function initializeSelection(getResults: () => Favorite[]): void {
  getSearchResults = getResults;
}

export function unselectAll(): void {
  if (!atLeastOneFavoriteIsSelected) {
    return;
  }

  for (const favorite of selected) {
    select(favorite, false);
  }
  atLeastOneFavoriteIsSelected = false;
}

export function selectAll(): void {
  for (const favorite of getSearchResults()) {
    select(favorite, true);
  }
}

export function select(favorite: Favorite, value?: boolean): void {
  atLeastOneFavoriteIsSelected = true;

  if (value === undefined) {
    value = !selected.has(favorite);
  }

  if (value) {
    selected.add(favorite);
  } else {
    selected.delete(favorite);
  }
  toggleOutline(favorite, value);
}

export function highlightSelectedThumbsOnPageChange(): void {
  if (!atLeastOneFavoriteIsSelected) {
    return;
  }

  for (const favorite of getSelectedFavoritesOnPage()) {
    toggleOutline(favorite, true);
  }
}

export function getSelected(): Set<Favorite> {
  return selected;
}

function getSelectedFavoritesOnPage(): Favorite[] {
  return getSearchResults().filter(favorite => document.getElementById(favorite.id) !== null && isSelected(favorite));
}

function toggleOutline(favorite: Favorite, value: boolean): void {
  if (document.getElementById(favorite.id) !== null || !value) {
    favorite.root.classList.toggle("tag-modifier-selected", value);
  }
}

function isSelected(favorite: Favorite): boolean {
  return selected.has(favorite);
}
