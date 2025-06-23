import * as FavoritesAspectRatios from "./content/skeleton/favorites_aspect_ratio_collector";
import * as FavoritesPaginationMenu from "./menu/favorites_pagination_menu";
import * as FavoritesPreloader from "../../../utils/dom/thumb_preloader";
import * as FavoritesStatus from "./menu/favorites_status_bar";
import * as FavoritesTiler from "./content/tilers/favorites_tiler";
import { changeFavoritesSizeOnShiftScroll, toggleAddOrRemoveButtons, toggleDownloadButtons } from "../ui/favorites_menu_event_handlers";
import { scrollToTop, waitForAllThumbnailsToLoad } from "../../../utils/dom/dom";
import { Favorite } from "../../../types/interfaces/interfaces";
import { FavoriteItem } from "../types/favorite/favorite_item";
import { FavoriteLayout } from "../../../types/primitives/primitives";
import { FavoritesPaginationParameters } from "../types/favorite_pagination_parameters";
import { FavoritesWheelEvent } from "../../../types/events/wheel_event";
import { GeneralSettings } from "../../../config/general_settings";
import { Preferences } from "../../../store/local_storage/preferences";
import { USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "../../../lib/global/flags/intrinsic_flags";
import { createFavoriteItemHTMLTemplates } from "../types/favorite/favorite_element";
import { sleep } from "../../../utils/misc/async";

export function setStatus(message: string): void {
  FavoritesStatus.setStatus(message);
}

export function showTemporaryNotification(message: string): void {
  FavoritesStatus.setTemporaryStatus(message);
}

export function updateStatusWhileFetching(searchResultCount: number, totalFavoritesCount: number): void {
  FavoritesStatus.updateStatusWhileFetching(searchResultCount, totalFavoritesCount);
}

export function insertNewSearchResults(thumbs: HTMLElement[]): void {
  FavoritesTiler.addItemsToBottom(thumbs);
}

export function insertNewSearchResultsOnReload(results: { newSearchResults: Favorite[], newFavorites: Favorite[], allSearchResults: Favorite[] }): void {
  FavoritesTiler.addItemsToTop(results.newSearchResults.map((favorite) => favorite.root));
  FavoritesStatus.notifyNewFavoritesFound(results.newFavorites.length);
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
  createFavoriteItemHTMLTemplates();
  collectAspectRatios();
  FavoritesStatus.setupFavoritesStatus();
  FavoritesTiler.setupFavoritesTiler();
  FavoritesPaginationMenu.setupFavoritesPaginationMenu();
  updateColumnCount(Preferences.columnCount.value);
  toggleAddOrRemoveButtons(USER_IS_ON_THEIR_OWN_FAVORITES_PAGE ? Preferences.removeButtonsVisible.value : Preferences.addButtonsVisible.value);
  toggleDownloadButtons(Preferences.downloadButtonsVisible.value);
}

export function preloadThumbnails(favorites: FavoriteItem[]): void {
  if (GeneralSettings.preloadThumbnails) {
    FavoritesPreloader.preloadThumbnails(favorites);
  }
}

export function preloadURLs(urls: string[]): void {
  if (GeneralSettings.preloadThumbnails) {
    FavoritesPreloader.preloadImages(urls);
  }
}

export function getCurrentLayout(): FavoriteLayout {
  return FavoritesTiler.getCurrentLayout();
}

export function changeFavoritesSizeUsingWheel(wheelEvent: FavoritesWheelEvent): void {
  changeFavoritesSizeOnShiftScroll(wheelEvent);
}

export function collectAspectRatios(): void {
  FavoritesAspectRatios.collectAspectRatios();
}
