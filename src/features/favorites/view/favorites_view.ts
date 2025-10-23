import * as ContentTiler from "../../../lib/global/content/tilers/tiler";
import * as FavoritesAspectRatios from "../../../lib/global/content/skeleton/aspect_ratio_collector";
import * as FavoritesPaginationMenu from "./menu/favorites_pagination_menu";
import * as FavoritesPreloader from "../../../utils/dom/thumb_preloader";
import * as FavoritesStatus from "./menu/favorites_status_bar";
import { scrollToTop, waitForAllThumbnailsToLoad } from "../../../utils/dom/dom";
import { toggleAddOrRemoveButtons, toggleDownloadButtons } from "../ui/favorites_menu_event_handlers";
import { Favorite } from "../../../types/favorite_types";
import { FavoriteItem } from "../types/favorite/favorite_item";
import { FavoritesPaginationParameters } from "../types/favorite_pagination_parameters";
import { GeneralSettings } from "../../../config/general_settings";
import { Layout } from "../../../types/common_types";
import { Preferences } from "../../../lib/global/preferences/preferences";
import { USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "../../../lib/global/flags/intrinsic_flags";
import { createFavoriteItemHTMLTemplates } from "../types/favorite/favorite_element";
import { hideUnusedLayoutSizer } from "../../../lib/global/content/tilers/tiler_event_handlers";
import { sleep } from "../../../utils/misc/async";

export function setStatus(message: string): void {
  FavoritesStatus.setStatus(message);
}

export function setTemporaryStatus(message: string): void {
  FavoritesStatus.setTemporaryStatus(message);
}

export function updateStatusWhileFetching(searchResultCount: number, totalFavoritesCount: number): void {
  FavoritesStatus.updateStatusWhileFetching(searchResultCount, totalFavoritesCount);
}

export function insertNewSearchResults(thumbs: HTMLElement[]): void {
  ContentTiler.addItemsToBottom(thumbs);
}

export function insertNewSearchResultsOnReload(results: { newSearchResults: Favorite[], newFavorites: Favorite[], allSearchResults: Favorite[] }): void {
  ContentTiler.addItemsToTop(results.newSearchResults.map((favorite) => favorite.root));
  FavoritesStatus.notifyNewFavoritesFound(results.newFavorites.length);
}

export function changeLayout(layout: Layout): void {
  ContentTiler.changeLayout(layout);
}

export function showSearchResults(searchResults: Favorite[]): void {
  ContentTiler.tile(searchResults.map((result) => result.root));
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
  ContentTiler.setupTiler();
  ContentTiler.showSkeleton();
  hideUnusedLayoutSizer(Preferences.favoritesLayout.value);
  FavoritesPaginationMenu.setupFavoritesPaginationMenu();
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

export function getCurrentLayout(): Layout {
  return ContentTiler.getCurrentLayout();
}

export function collectAspectRatios(): void {
  FavoritesAspectRatios.collectAspectRatios();
}
