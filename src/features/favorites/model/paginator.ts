import { Favorite, PageRelation } from "@/types/favorite";
import { FavoritesPaginationParameters } from "@/features/favorites/types/favorite_types";
import { NavigationKey } from "@/types/input";
import { Preferences } from "@/app/context/preferences";
import { clamp } from "@/utils/number";
import { navigationDelta } from "@/utils/navigation";

type PageRange = { start: number; end: number };

let currentPageNumber = 1;
let resultsPerPage = Preferences.favoritesResultsPerPage.value;
let favorites: Favorite[] = [];

export const pageCount = (): number => Math.ceil(favorites.length / resultsPerPage) || 1;
export const onFinalPage = (): boolean => currentPageNumber === pageCount();
export const onFirstPage = (): boolean => currentPageNumber === 1;
export const onlyOnePage = (): boolean => onFirstPage() && onFinalPage();
export const currentPageFavorites = (): Favorite[] => favoritesOnPage(currentPageNumber);
export const nextPageFavorites = (): Favorite[] => favoritesOnPage(currentPageNumber + 1);
export const previousPageFavorites = (): Favorite[] => favoritesOnPage(currentPageNumber - 1);
export const adjacentPageFavorites = (): Favorite[] => [...nextPageFavorites(), ...previousPageFavorites()];
export const selectFirstPage = (): void => selectPage(1);
export const selectLastPage = (): void => selectPage(pageCount());

export function selectPage(pageNumber: number): void {
  currentPageNumber = clamp(pageNumber, 1, pageCount());
}

export function paginate(newFavorites: Favorite[]): void {
  favorites = newFavorites;
}
export function setResultsPerPage(newResultsPerPage: number): void {
  resultsPerPage = newResultsPerPage;
}

export function getPaginationParameters(): FavoritesPaginationParameters {
  const { start, end } = pageRange(currentPageNumber);
  return { currentPageNumber, finalPageNumber: pageCount(), favoritesCount: favorites.length, startIndex: start, endIndex: end };
}

export function selectAdjacentPage(direction: NavigationKey): boolean {
  if (onlyOnePage()) {
    return false;
  }
  const nextPage = ((currentPageNumber - 1 + navigationDelta(direction) + pageCount()) % pageCount()) + 1;

  selectPage(nextPage);
  return true;
}

export function selectRelativePage(relation: PageRelation): boolean {
  if (onlyOnePage()) {
    return false;
  }

  if ((
    (relation === "first" || relation === "previous") && onFirstPage()) ||
    ((relation === "final" || relation === "next") && onFinalPage())) {
    return false;
  }

  switch (relation) {
    case "previous": selectPage(currentPageNumber - 1);
      break;
    case "first": selectFirstPage();
      break;
    case "next": selectPage(currentPageNumber + 1);
      break;
    case "final": selectLastPage();
      break;
    default: return false;
  }
  return true;
}

export function selectPageContaining(id: string): boolean {
  const index = favorites.findIndex(f => f.id === id);

  if (index === -1) {
    return false;
  }
  const pageNumber = Math.floor(index / resultsPerPage) + 1;

  if (currentPageNumber !== pageNumber) {
    selectPage(pageNumber);
    return true;
  }
  return false;
}

function pageRange(pageNumber: number): PageRange {
  return { start: resultsPerPage * (pageNumber - 1), end: resultsPerPage * pageNumber };
}

function favoritesOnPage(pageNumber: number): Favorite[] {
  const { start, end } = pageRange(pageNumber);
  return favorites.slice(start, end);
}
