import * as ContentTiler from "../../../lib/global/content/tilers/tiler";
import * as FavoritesPaginationMenu from "./menu/favorites_pagination_menu";
import * as FavoritesStatus from "./menu/favorites_status_bar";
import { scrollToTop, waitForAllThumbnailsToLoad } from "../../../utils/dom/dom";
import { Favorite } from "../../../types/favorite_types";
import { FavoritesPaginationParameters } from "../types/favorite_pagination_parameters";
import { NewFavorites } from "../types/favorite/favorite_types";
import { collectAspectRatios } from "../../../lib/global/content/skeleton/aspect_ratio_collector";
import { createFavoriteItemHTMLTemplates } from "../types/favorite/favorite_element";
import { sleep } from "../../../utils/misc/async";

export function insertNewSearchResultsOnReload(results: NewFavorites): void {
  ContentTiler.addItemsToTop(results.newSearchResults.map((favorite) => favorite.root));
}

export function showSearchResults(searchResults: Favorite[]): void {
  ContentTiler.tile(searchResults.map((result) => result.root));
  scrollToTop();
}

export function createPageSelectionMenuWhileFetching(parameters: FavoritesPaginationParameters): void {
  FavoritesPaginationMenu.update(parameters);
}

export async function revealFavorite(id: string): Promise<void> {
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

export function setupFavoritesView(): void {
  createFavoriteItemHTMLTemplates();
  collectAspectRatios();
  FavoritesStatus.setupFavoritesStatus();
  ContentTiler.setupTiler();
  ContentTiler.showSkeleton();
  FavoritesPaginationMenu.setupFavoritesPaginationMenu();
}

export { toggle as togglePaginationMenu, getContainer as getPaginationMenu, create as createPageSelectionMenu } from "./menu/favorites_pagination_menu";
export { addItemsToBottom as insertNewSearchResults, changeLayout } from "../../../lib/global/content/tilers/tiler";
export * from "./dom/favorites_thumb_preloader";
export * from "./menu/favorites_status_bar";
export * from "./results/favorites_infinite_scroll_feeder";
export * from "./results/favorites_paginator";
export * from "./dom/favorites_item_dom";
