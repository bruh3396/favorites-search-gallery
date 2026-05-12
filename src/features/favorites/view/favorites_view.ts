import * as ContentTiler from "../../../lib/layout/content_tiler";
import * as FavoritesNavigator from "./navigation/navigator";
import * as FavoritesShell from "./shell/favorites_shell";
import * as FavoritesStatus from "./status/status";
import { Favorite, PageRelation } from "../../../types/favorite";
import { NewFavorites } from "../types/favorite_types";
import { buildElementTemplate } from "../types/favorite_element_template";
import { favoritesSkeleton } from "./skeleton/skeleton";
import { scrollToTop } from "../../../lib/ui/dom";

export interface FavoritesViewCallbacks {
  onPageSelected: (pageNumber: number) => void;
  onRelativePageSelected: (relation: PageRelation) => void;
}

export function addToTop(results: NewFavorites): void {
  ContentTiler.addToTop(results.newSearchResults.map((favorite) => favorite.root));
}

export function showSearchResults(searchResults: Favorite[]): void {
  ContentTiler.tile(searchResults.map((result) => result.root));
  scrollToTop();
}

export function setup(viewCallbacks: FavoritesViewCallbacks): void {
  buildElementTemplate();
  FavoritesShell.setup();
  FavoritesStatus.setup();
  ContentTiler.setup();
  ContentTiler.tile(favoritesSkeleton());
  FavoritesNavigator.setup(viewCallbacks);
}

export { toggle as toggleNavigator, getContainer as getNavigationContainer, create as createNavigationMenu, update as updateNavigationMenu } from "./navigation/navigator";
export { addToBottom, changeLayout } from "../../../lib/layout/content_tiler";

export * from "./update/thumb_preloader";
export * from "./status/status";
export * from "./navigation/infinite_scroll";
export * from "./navigation/paginator";
export * from "./update/favorites_item_update";
export * from "./skeleton/aspect_ratio_collector";
export * from "./update/ui_toggles";
