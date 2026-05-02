import { Favorite, FavoritesPageRelation } from "../../../../types/favorite";
import { FavoritesPaginationParameters } from "../../type/favorite_types";
import { NavigationKey } from "../../../../types/input";
import { Preferences } from "../../../../lib/preferences/preferences";
import { clamp } from "../../../../utils/number";
import { isForwardNavigationKey } from "../../../../types/guards";

type PageRange = { start: number; end: number };

let currentPageNumber = 1;
let resultsPerPage = Preferences.resultsPerPage.value;
let favorites: Favorite[] = [];

export const countPages = (): number => Math.ceil(favorites.length / resultsPerPage) || 1;
export const onFirstPage = (): boolean => currentPageNumber === 1;
export const onFinalPage = (): boolean => currentPageNumber === countPages();
export const onlyOnePage = (): boolean => onFirstPage() && onFinalPage();
export const getFavoritesOnCurrentPage = (): Favorite[] => getFavoritesOnPage(currentPageNumber);
export const getFavoritesOnNextPage = (): Favorite[] => getFavoritesOnPage(currentPageNumber + 1);
export const getFavoritesOnPreviousPage = (): Favorite[] => getFavoritesOnPage(currentPageNumber - 1);

export function setFavorites(newFavorites: Favorite[]): void {
  favorites = newFavorites;
}

export function setResultsPerPage(newResultsPerPage: number): void {
  resultsPerPage = newResultsPerPage;
}

function getPageRange(pageNumber: number): PageRange {
  return { start: resultsPerPage * (pageNumber - 1), end: resultsPerPage * pageNumber };
}

function getFavoritesOnPage(pageNumber: number): Favorite[] {
  const { start, end } = getPageRange(pageNumber);
  return favorites.slice(start, end);
}

export function getPaginationParameters(): FavoritesPaginationParameters {
  const { start, end } = getPageRange(currentPageNumber);
  return { currentPageNumber, finalPageNumber: countPages(), favoritesCount: favorites.length, startIndex: start, endIndex: end };
}

export function gotoPage(pageNumber: number): void {
  currentPageNumber = clamp(pageNumber, 1, countPages());
}

export function gotoFirstPage(): void {
  gotoPage(1);
}

export function gotoLastPage(): void {
  gotoPage(countPages());
}

export function gotoAdjacentPage(direction: NavigationKey): boolean {
  if (onlyOnePage()) {
    return false;
  }
  const forward = isForwardNavigationKey(direction);

  if (forward && onFinalPage()) {
    gotoFirstPage();
  } else if (forward) {
    gotoPage(currentPageNumber + 1);
  } else if (onFirstPage()) {
    gotoLastPage();
  } else {
    gotoPage(currentPageNumber - 1);
  }
  return true;
}

export function gotoRelativePage(relation: FavoritesPageRelation): boolean {
  if (onlyOnePage()) {
    return false;
  }

  switch (relation) {
    case "previous": return !onFirstPage() && (gotoPage(currentPageNumber - 1), true);
    case "first": return !onFirstPage() && (gotoFirstPage(), true);
    case "next": return !onFinalPage() && (gotoPage(currentPageNumber + 1), true);
    case "final": return !onFinalPage() && (gotoLastPage(), true);
    default: return false;
  }
}

export function gotoPageWithFavorite(id: string): boolean {
  const index = favorites.findIndex(f => f.id === id);

  if (index === -1) {
    return false;
  }
  const pageNumber = Math.floor(index / resultsPerPage) + 1;

  if (currentPageNumber !== pageNumber) {
    gotoPage(pageNumber);
    return true;
  }
  return false;
}
