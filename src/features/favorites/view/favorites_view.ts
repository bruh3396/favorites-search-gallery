import * as FavoritesPaginationMenu from "./navigation/favorites_page_navigator";
import * as FavoritesShell from "./shell/favorites_shell";
import * as FavoritesStatus from "./status/favorites_status";
import * as Layout from "../../../lib/layout/layout";
import { Favorite } from "../../../types/favorite";
import { NewFavorites } from "../type/favorite_types";
import { buildFavoriteElementTemplate } from "../type/favorite_element_template";
import { getFavoritesSkeleton } from "./skeleton/favorites_skeleton";
import { scrollToTop } from "../../../lib/ui/dom";

export function insertNewSearchResultsOnReload(results: NewFavorites): void {
  Layout.addToTop(results.newSearchResults.map((favorite) => favorite.root));
}

export function showSearchResults(searchResults: Favorite[]): void {
  Layout.tile(searchResults.map((result) => result.root));
  scrollToTop();
}

export function setupFavoritesView(): void {
  buildFavoriteElementTemplate();
  FavoritesShell.setupFavoritesShell();
  FavoritesStatus.setupFavoritesStatus();
  Layout.setupLayout();
  Layout.tile(getFavoritesSkeleton());
  FavoritesPaginationMenu.setupFavoritesPaginationMenu();
}

export { toggle as togglePaginationMenu, getContainer as getPaginationMenu, create as createPageSelectionMenu, update as createPageSelectionMenuWhileFetching } from "./navigation/favorites_page_navigator";
export { addToBottom as insertNewSearchResults, changeLayout } from "../../../lib/layout/layout";

export * from "./update/favorites_thumb_preloader";
export * from "./status/favorites_status";
export * from "./navigation/favorites_infinite_scroll";
export * from "./navigation/favorites_paginator";
export * from "./update/favorites_item_update";
export * from "./skeleton/favorites_aspect_ratio_collector";
export * from "./update/favorites_menu_event_handlers";
