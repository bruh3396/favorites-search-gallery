import { Favorite, PageRelation } from "../../../../types/favorite";
import { FavoritesPaginationParameters } from "../../types/favorite_types";
import { NavigationKey } from "../../../../types/input";
import { Preferences } from "../../../../lib/preferences/preferences";
import { clamp } from "../../../../utils/number";
import { isForwardNavigationKey } from "../../../../types/guards";

type PageRange = { start: number; end: number };

let currentPageNumber = 1;
let resultsPerPage = Preferences.resultsPerPage.value;
let favorites: Favorite[] = [];

function pageRange(pageNumber: number): PageRange {
  return { start: resultsPerPage * (pageNumber - 1), end: resultsPerPage * pageNumber };
}

function favoritesOnPage(pageNumber: number): Favorite[] {
  const { start, end } = pageRange(pageNumber);
  return favorites.slice(start, end);
}

export const pageCount = (): number => Math.ceil(favorites.length / resultsPerPage) || 1;
export const onFinalPage = (): boolean => currentPageNumber === pageCount();
export const onFirstPage = (): boolean => currentPageNumber === 1;
export const onlyOnePage = (): boolean => onFirstPage() && onFinalPage();
export const currentPageFavorites = (): Favorite[] => favoritesOnPage(currentPageNumber);
export const nextPageFavorites = (): Favorite[] => favoritesOnPage(currentPageNumber + 1);
export const previousPageFavorites = (): Favorite[] => favoritesOnPage(currentPageNumber - 1);
export const goToFirstPage = (): void => goToPage(1);
export const goToLastPage = (): void => goToPage(pageCount());

export function goToPage(pageNumber: number): void {
  currentPageNumber = clamp(pageNumber, 1, pageCount());
}

export function setFavorites(newFavorites: Favorite[]): void {
  favorites = newFavorites;
}
export function setResultsPerPage(newResultsPerPage: number): void {
  resultsPerPage = newResultsPerPage;
}

export function getPaginationParameters(): FavoritesPaginationParameters {
  const { start, end } = pageRange(currentPageNumber);
  return { currentPageNumber, finalPageNumber: pageCount(), favoritesCount: favorites.length, startIndex: start, endIndex: end };
}

export function goToAdjacentPage(direction: NavigationKey): boolean {
  if (onlyOnePage()) {
    return false;
  }
  const delta = isForwardNavigationKey(direction) ? 1 : -1;
  const nextPage = ((currentPageNumber - 1 + delta + pageCount()) % pageCount()) + 1;

  goToPage(nextPage);
  return true;
}

export function goToRelativePage(relation: PageRelation): boolean {
  if (onlyOnePage()) {
    return false;
  }

  if ((
    (relation === "first" || relation === "previous") && onFirstPage()) ||
    ((relation === "final" || relation === "next") && onFinalPage())) {
    return false;
  }

  switch (relation) {
    case "previous": goToPage(currentPageNumber - 1);
      break;
    case "first": goToFirstPage();
      break;
    case "next": goToPage(currentPageNumber + 1);
      break;
    case "final": goToLastPage();
      break;
    default: return false;
  }
  return true;
}

export function goToPageWithFavorite(id: string): boolean {
  const index = favorites.findIndex(f => f.id === id);

  if (index === -1) {
    return false;
  }
  const pageNumber = Math.floor(index / resultsPerPage) + 1;

  if (currentPageNumber !== pageNumber) {
    goToPage(pageNumber);
    return true;
  }
  return false;
}
