import {FavoriteItem} from "../../types/favorite/favorite";
import {FavoritesPaginationParameters} from "../../types/pagination_parameters";
import {NavigationKey} from "../../../../types/primitives/primitives";
import {Preferences} from "../../../../store/preferences/preferences";
import {clamp} from "../../../../utils/primitive/number";
import {isForwardNavigationKey} from "../../../../types/primitives/equivalence";

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

function onFirstPage(): boolean {
  return currentPageNumber === 1;
}

function onFinalPage(): boolean {
  return currentPageNumber === getPageCount();
}

function onlyOnePage(): boolean {
  return onFirstPage() && onFinalPage();
}

function getPaginationParameters(): FavoritesPaginationParameters {
  const {start, end} = getCurrentPageRange();
  return new FavoritesPaginationParameters(currentPageNumber, getPageCount(), favorites.length, start, end);
}

function paginate(newFavorites: FavoriteItem[]): void {
  favorites = newFavorites;
}

function changePage(pageNumber: number): void {
  currentPageNumber = clamp(pageNumber, 1, getPageCount());
}

function gotoFirstPage(): void {
  changePage(1);
}

function gotoLastPage(): void {
  changePage(getPageCount());
}

function getFavoritesOnCurrentPage(): FavoriteItem[] {
  const {start, end} = getCurrentPageRange();
  return favorites.slice(start, end);
}

function getCurrentPageRange(): { start: number; end: number } {
  return {
    start: resultsPerPage * (currentPageNumber - 1),
    end: resultsPerPage * currentPageNumber
  };
}

function changeResultsPerPage(newResultsPerPage: number): void {
  resultsPerPage = newResultsPerPage;
}

function gotoAdjacentPage(direction: NavigationKey): boolean {
  const forward = isForwardNavigationKey(direction);

  if (onlyOnePage()) {
    return false;
  }

  if (onFinalPage() && forward) {
    gotoFirstPage();
  } else if (onFirstPage() && !forward) {
    gotoLastPage();
    return true;
  } else {
    changePage(forward ? currentPageNumber + 1 : currentPageNumber - 1);
  }
  return true;
}

function gotoRelativePage(relation: string): boolean {
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

function gotoPageWithFavorite(id: string): boolean {
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

export const FavoritesPaginator = {
  paginate,
  changePage,
  changeResultsPerPage,
  gotoRelativePage,
  gotoAdjacentPage,
  getPaginationParameters,
  getFavoritesOnCurrentPage,
  gotoPageWithFavorite,
  onFinalPage,
  onFirstPage,
  onlyOnePage
};
