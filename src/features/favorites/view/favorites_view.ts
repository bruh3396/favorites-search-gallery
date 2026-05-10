import * as ContentTiler from "../../../lib/layout/layout";
import * as FavoritesPaginationMenu from "./navigation/navigator";
import * as FavoritesShell from "./shell/favorites_shell";
import * as FavoritesStatus from "./status/status";
import { Favorite } from "../../../types/favorite";
import { NewFavorites } from "../types/favorite_types";
import { buildFavoriteElementTemplate } from "../types/favorite_element_template";
import { getFavoritesSkeleton } from "./skeleton/skeleton";
import { scrollToTop } from "../../../lib/ui/dom";

export function addToTop(results: NewFavorites): void {
  ContentTiler.addToTop(results.newSearchResults.map((favorite) => favorite.root));
}

export function showSearchResults(searchResults: Favorite[]): void {
  ContentTiler.tile(searchResults.map((result) => result.root));
  scrollToTop();
}

export function setupFavoritesView(): void {
  buildFavoriteElementTemplate();
  FavoritesShell.setupFavoritesShell();
  FavoritesStatus.setupFavoritesStatus();
  ContentTiler.setupLayout();
  ContentTiler.tile(getFavoritesSkeleton());
  FavoritesPaginationMenu.setupFavoritesPaginationMenu();
}

export { toggle as togglePaginationMenu, getContainer as getPaginationMenu, create as createPageSelectionMenu, update as createPageSelectionMenuWhileFetching } from "./navigation/navigator";
export { addToBottom, changeLayout } from "../../../lib/layout/layout";

export * from "./update/thumb_preloader";
export * from "./status/status";
export * from "./navigation/infinite_scroll";
export * from "./navigation/paginator";
export * from "./update/favorites_item_update";
export * from "./skeleton/aspect_ratio_collector";
export * from "./update/menu_event_handlers";
