import {scrollToTop, waitForAllThumbnailsToLoad} from "../../../utils/dom/dom";
import {toggleAddOrRemoveButtons, toggleDownloadButtons} from "./utils";
import {Favorite} from "../types/favorite/interfaces";
import {FavoriteLayout} from "../../../types/primitives/primitives";
import {FavoritesPaginationMenu} from "./pagination_menu";
import {FavoritesPaginationParameters} from "../types/pagination_parameters";
import {FavoritesStatus} from "./status";
import {FavoritesTiler} from "./tilers/favorites_tiler";
import {Preferences} from "../../../store/preferences/preferences";
import {USER_IS_ON_THEIR_OWN_FAVORITES_PAGE} from "../../../lib/functional/flags";
import {sleep} from "../../../utils/misc/generic";

function showNotification(message: string): void {
  FavoritesStatus.setStatus(message);
}

function updateStatusWhileFetching(searchResultCount: number, totalFavoritesCount: number): void {
  FavoritesStatus.updateStatusWhileFetching(searchResultCount, totalFavoritesCount);
}

function insertNewSearchResults(thumbs: HTMLElement[]): void {
  FavoritesTiler.addItemsToBottom(thumbs);
}

function insertNewSearchResultsOnReload(results: { newSearchResults: Favorite[], newFavorites: Favorite[], allSearchResults: Favorite[] }): void {
  FavoritesTiler.addItemsToTop(results.newSearchResults.map((favorite) => favorite.root));
  notifyNewFavoritesFound(results.newFavorites.length);
}

function notifyNewFavoritesFound(newFavoritesCount: number): void {
  if (newFavoritesCount > 0) {
    const pluralSuffix = newFavoritesCount > 1 ? "s" : "";

    showNotification(`Found ${newFavoritesCount} new favorite${pluralSuffix}`);
  }
}

function changeLayout(layout: FavoriteLayout): void {
  FavoritesTiler.changeLayout(layout);
}

function updateColumnCount(columnCount: number): void {
  FavoritesTiler.updateColumnCount(columnCount);
}

function updateRowSize(rowSize: number) : void {
  FavoritesTiler.updateRowSize(rowSize);
}

function showSearchResults(searchResults: Favorite[]): void {
  FavoritesTiler.tile(searchResults.map((result) => result.root));
  scrollToTop();
}

function clear(): void {
  showSearchResults([]);
}

function setMatchCount(matchCount: number): void {
  FavoritesStatus.setMatchCount(matchCount);
}

function createPageSelectionMenu(parameters: FavoritesPaginationParameters): void {
  FavoritesPaginationMenu.create(parameters);
}

function createPageSelectionMenuWhileFetching(parameters : FavoritesPaginationParameters): void {
  FavoritesPaginationMenu.update(parameters);
}

async function revealFavorite(id: string) : Promise<void> {
  await waitForAllThumbnailsToLoad();
  const thumb = document.getElementById(id);

  if (thumb === null || thumb.classList.contains("blink")) {
    return;
  }
  thumb.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
  thumb.classList.add("blink");
  await sleep(1500);
  thumb.classList.remove("blink");
}

function getPaginationMenu(): HTMLElement {
  return FavoritesPaginationMenu.getContainer();
}

function togglePaginationMenu(value: boolean): void {
  FavoritesPaginationMenu.toggle(value);
}

function setup(): void {
  FavoritesStatus.setup();
  FavoritesTiler.setup();
  FavoritesPaginationMenu.setup();
  toggleAddOrRemoveButtons(USER_IS_ON_THEIR_OWN_FAVORITES_PAGE ? Preferences.showRemoveFavoriteButtons.value : Preferences.showAddFavoriteButtons.value);
  toggleDownloadButtons(Preferences.showDownloadButtons.value);
}

export const FavoritesView = {
  showNotification,
  updateStatusWhileFetching,
  insertNewSearchResults,
  insertNewSearchResultsOnReload,
  notifyNewFavoritesFound,
  changeLayout,
  updateColumnCount,
  updateRowSize,
  showSearchResults,
  clear,
  setMatchCount,
  createPageSelectionMenu,
  createPageSelectionMenuWhileFetching,
  revealFavorite,
  getPaginationMenu,
  togglePaginationMenu,
  setup
};
