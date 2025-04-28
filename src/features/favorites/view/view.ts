import * as FavoritesPaginationMenu from "./pagination_menu";
import * as FavoritesStatus from "./status";
import * as FavoritesTiler from "./tilers/favorites_tiler";
import {scrollToTop, waitForAllThumbnailsToLoad} from "../../../utils/dom/dom";
import {toggleAddOrRemoveButtons, toggleDownloadButtons} from "./utils";
import {Favorite} from "../types/favorite/interfaces";
import {FavoriteLayout} from "../../../types/primitives/primitives";
import {FavoritesPaginationParameters} from "../types/pagination_parameters";
import {Preferences} from "../../../store/preferences/preferences";
import {USER_IS_ON_THEIR_OWN_FAVORITES_PAGE} from "../../../lib/functional/flags";
import {setupImageSizes} from "./aspect_ratios";
import {sleep} from "../../../utils/misc/generic";

export function showNotification(message: string): void {
  FavoritesStatus.setStatus(message);
}

export function updateStatusWhileFetching(searchResultCount: number, totalFavoritesCount: number): void {
  FavoritesStatus.updateStatusWhileFetching(searchResultCount, totalFavoritesCount);
}

export function insertNewSearchResults(thumbs: HTMLElement[]): void {
  FavoritesTiler.addItemsToBottom(thumbs);
}

export function insertNewSearchResultsOnReload(results: { newSearchResults: Favorite[], newFavorites: Favorite[], allSearchResults: Favorite[] }): void {
  FavoritesTiler.addItemsToTop(results.newSearchResults.map((favorite) => favorite.root));
  notifyNewFavoritesFound(results.newFavorites.length);
}

export function notifyNewFavoritesFound(newFavoritesCount: number): void {
  if (newFavoritesCount > 0) {
    const pluralSuffix = newFavoritesCount > 1 ? "s" : "";

    showNotification(`Found ${newFavoritesCount} new favorite${pluralSuffix}`);
  }
}

export function changeLayout(layout: FavoriteLayout): void {
  FavoritesTiler.changeLayout(layout);
}

export function updateColumnCount(columnCount: number): void {
  FavoritesTiler.updateColumnCount(columnCount);
}

export function updateRowSize(rowSize: number) : void {
  FavoritesTiler.updateRowSize(rowSize);
}

export function showSearchResults(searchResults: Favorite[]): void {
  FavoritesTiler.tile(searchResults.map((result) => result.root));
  scrollToTop();
}

export function clear(): void {
  showSearchResults([]);
}

export function setMatchCount(matchCount: number): void {
  FavoritesStatus.setMatchCount(matchCount);
}

export function createPageSelectionMenu(parameters: FavoritesPaginationParameters): void {
  FavoritesPaginationMenu.create(parameters);
}

export function createPageSelectionMenuWhileFetching(parameters : FavoritesPaginationParameters): void {
  FavoritesPaginationMenu.update(parameters);
}

export async function revealFavorite(id: string) : Promise<void> {
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

export function getPaginationMenu(): HTMLElement {
  return FavoritesPaginationMenu.getContainer();
}

export function togglePaginationMenu(value: boolean): void {
  FavoritesPaginationMenu.toggle(value);
}

export function setupFavoritesView(): void {
  setupImageSizes();
  FavoritesStatus.setExpectedTotalFavoritesCount();
  FavoritesTiler.setupFavoritesTiler();
  FavoritesPaginationMenu.setupFavoritesPaginationMenu();
  toggleAddOrRemoveButtons(USER_IS_ON_THEIR_OWN_FAVORITES_PAGE ? Preferences.showRemoveFavoriteButtons.value : Preferences.showAddFavoriteButtons.value);
  toggleDownloadButtons(Preferences.showDownloadButtons.value);
}
