import * as FavoritesPaginationMenu from "./menu/favorites_pagination_menu";
import * as FavoritesStatus from "./menu/favorites_status_bar";
import * as Layout from "../../../lib/layout/layout";
import { Favorite } from "../../../types/favorite";
import { NewFavorites } from "../types/favorite_types";
import { buildFavoriteElementTemplate } from "../types/favorite_element";
import { collectAspectRatios } from "../ui/skeleton/favorites_skeleton_aspect_ratio_collector";
import { getFavoritesSkeleton } from "../ui/skeleton/favorites_skeleton";
import { scrollToTop } from "../../../lib/ui/dom";
import { sleep } from "../../../lib/core/scheduling/promise";
import { waitForAllThumbnailsToLoad } from "../../../lib/dom/content_thumb";

export function insertNewSearchResultsOnReload(results: NewFavorites): void {
  Layout.addToTop(results.newSearchResults.map((favorite) => favorite.root));
}

export function showSearchResults(searchResults: Favorite[]): void {
  Layout.tile(searchResults.map((result) => result.root));
  scrollToTop();
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
  buildFavoriteElementTemplate();
  collectAspectRatios();
  FavoritesStatus.setupFavoritesStatus();
  Layout.setupLayout();
  Layout.tile(getFavoritesSkeleton());
  FavoritesPaginationMenu.setupFavoritesPaginationMenu();
}

export { toggle as togglePaginationMenu, getContainer as getPaginationMenu, create as createPageSelectionMenu, update as createPageSelectionMenuWhileFetching } from "./menu/favorites_pagination_menu";
export { addToBottom as insertNewSearchResults, changeLayout } from "../../../lib/layout/layout";
export * from "./dom/favorites_thumb_preloader";
export * from "./menu/favorites_status_bar";
export * from "./results/favorites_infinite_scroll_results";
export * from "./results/favorites_paginator";
export * from "./dom/favorites_item_dom";
