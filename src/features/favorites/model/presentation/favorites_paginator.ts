import { FavoriteItem } from "../../types/favorite/favorite_item";
import { FavoritesPageRelation } from "../../types/favorite/favorite_types";
import { FavoritesPaginationParameters } from "../../types/favorite_pagination_parameters";
import { NavigationKey } from "../../../../types/common_types";
import { Preferences } from "../../../../lib/global/preferences/preferences";
import { clamp } from "../../../../utils/primitive/number";
import { isForwardNavigationKey } from "../../../../types/equivalence";

let currentPageNumber = 1;
let resultsPerPage = Preferences.resultsPerPage.value;
let favorites: FavoriteItem[] = [];

function getPageCount(): number {
  const favoriteCount = favorites.length;

  if (favoriteCount === 0) {
    return 1;
  }
  const pageCount = favoriteCount / resultsPerPage;

  if (favoriteCount % resultsPerPage === 0) {
    return pageCount;
  }
  return Math.floor(pageCount) + 1;
}

export function onFirstPage(): boolean {
  return currentPageNumber === 1;
}

export function onFinalPage(): boolean {
  return currentPageNumber === getPageCount();
}

export function onlyOnePage(): boolean {
  return onFirstPage() && onFinalPage();
}

export function getPaginationParameters(): FavoritesPaginationParameters {
  const { start, end } = getCurrentPageRange();
  return { currentPageNumber, finalPageNumber: getPageCount(), favoritesCount: favorites.length, startIndex: start, endIndex: end };
}

export function paginate(newFavorites: FavoriteItem[]): void {
  favorites = newFavorites;
}

export function changePage(pageNumber: number): void {
  currentPageNumber = clamp(pageNumber, 1, getPageCount());
}

export function gotoFirstPage(): void {
  changePage(1);
}

function gotoLastPage(): void {
  changePage(getPageCount());
}

export function getFavoritesOnCurrentPage(): FavoriteItem[] {
  return getFavoritesOnPage(currentPageNumber);
}

export function getFavoritesOnNextPage(): FavoriteItem[] {
  return getFavoritesOnPage(currentPageNumber + 1);
}

export function getFavoritesOnPreviousPage(): FavoriteItem[] {
  return getFavoritesOnPage(currentPageNumber - 1);
}

function getFavoritesOnPage(pageNumber: number): FavoriteItem[] {
  const { start, end } = getPageRange(pageNumber);
  return favorites.slice(start, end);
}

function getCurrentPageRange(): { start: number; end: number } {
  return getPageRange(currentPageNumber);
}

function getPageRange(pageNumber: number): { start: number; end: number } {
  return {
    start: resultsPerPage * (pageNumber - 1),
    end: resultsPerPage * pageNumber
  };
}

export function changeResultsPerPage(newResultsPerPage: number): void {
  resultsPerPage = newResultsPerPage;
}

export function gotoAdjacentPage(direction: NavigationKey): boolean {
  const forward = isForwardNavigationKey(direction);

  if (onlyOnePage()) {
    return false;
  }

  if (onFinalPage() && forward) {
    gotoFirstPage();
  } else if (onFirstPage() && !forward) {
    gotoLastPage();
  } else {
    changePage(forward ? currentPageNumber + 1 : currentPageNumber - 1);
  }
  return true;
}

export function gotoRelativePage(relation: FavoritesPageRelation): boolean {
  if (onlyOnePage()) {
    return false;
  }

  switch (relation) {
    case "previous":
      if (onFirstPage()) {
        return false;
      }
      gotoAdjacentPage("ArrowLeft");
      return true;

    case "first":
      if (onFirstPage()) {
        return false;
      }
      gotoFirstPage();
      return true;

    case "next":
      if (onFinalPage()) {
        return false;
      }
      return gotoAdjacentPage("ArrowRight");

    case "final":
      if (onFinalPage()) {
        return false;
      }
      gotoLastPage();
      return true;

    default:
      return false;
  }
}

export function gotoPageWithFavorite(id: string): boolean {
  const favoriteIds = favorites.map(favorite => favorite.id);
  const index = favoriteIds.indexOf(id);
  const favoriteNotFound = index === -1;

  if (favoriteNotFound) {
    return false;
  }
  const pageNumber = Math.floor(index / resultsPerPage) + 1;
  const favoriteOnDifferentPage = currentPageNumber !== pageNumber;

  if (favoriteOnDifferentPage) {
    changePage(pageNumber);
    return true;
  }
  return false;
}
