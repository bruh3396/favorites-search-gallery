import * as ContentTiler from "@/app/layout/content_tiler";
import * as FavoritesDrawer from "@/features/favorites/view/shell/drawer";
import * as FavoritesPaginator from "@/features/favorites/view/paginator";
import * as FavoritesShell from "@/features/favorites/view/shell/favorites_shell";
import * as FavoritesSkeleton from "@/features/favorites/view/skeleton/skeleton";
import * as FavoritesStatus from "@/features/favorites/view/status/status";
import { Favorite } from "@/types/favorite";
import { FavoritesViewCallbacks } from "@/features/favorites/types/interfaces";
import { scrollToTop } from "@/lib/thumb/thumbs";
import { setupFavoriteElement } from "@/features/favorites/types/favorite_element";

export function showSearchResults(searchResults: Favorite[]): void {
  ContentTiler.tile(searchResults.map((result) => result.root));
  scrollToTop();
}

export function setup(viewCallbacks: FavoritesViewCallbacks): void {
  setupFavoriteElement();
  FavoritesShell.setup(viewCallbacks.onFirstPageFavoritesExtracted);
  FavoritesStatus.setup();
  ContentTiler.setup();
  FavoritesPaginator.setup(viewCallbacks.onPageSelected, viewCallbacks.onPageStepped);
  FavoritesDrawer.setup();
}

export const addToTop = (favorites: Favorite[]): void => ContentTiler.addToTop(favorites.map((favorite) => favorite.root));
export const addToBottom = (favorites: Favorite[]): void => ContentTiler.addToBottom(favorites.map((favorite) => favorite.root));
export const showSkeleton = (): void => ContentTiler.tile(FavoritesSkeleton.build());

export { toggle as togglePaginator, getContainer as getPaginationContainer, build as buildPaginator, update as updatePaginator } from "@/features/favorites/view/paginator";
export { toggle as toggleDrawer } from "@/features/favorites/view/shell/drawer";
export { changeLayout } from "@/app/layout/content_tiler";
export { collectAspectRatios } from "@/features/favorites/view/skeleton/skeleton";

export * from "@/features/favorites/view/status/status";
export * from "@/features/favorites/dom_tweaks/ui_toggles";
