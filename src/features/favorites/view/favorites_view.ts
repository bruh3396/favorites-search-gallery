import * as ContentTiler from "@/app/layout/content_tiler";
import * as FavoritesDrawer from "@/features/favorites/view/shell/drawer";
import * as FavoritesNavigator from "@/features/favorites/view/navigation/navigator";
import * as FavoritesShell from "@/features/favorites/view/shell/favorites_shell";
import * as FavoritesSkeleton from "@/features/favorites/view/skeleton/skeleton";
import * as FavoritesStatus from "@/features/favorites/view/status/status";
import { Favorite } from "@/types/favorite";
import { FavoritesViewCallbacks } from "@/features/favorites/types/favorite_types";
import { scrollToTop } from "@/lib/thumb/thumbs";
import { setupFavoriteElement } from "@/features/favorites/types/favorite_element";

export function addToTop(items: Favorite[] | HTMLElement[]): void {
  ContentTiler.addToTop(toElements(items));
}

export function addToBottom(items: Favorite[] | HTMLElement[]): void {
  ContentTiler.addToBottom(toElements(items));
}

export function showSearchResults(searchResults: Favorite[]): void {
  ContentTiler.tile(searchResults.map((result) => result.root));
  scrollToTop();
}

export function setup(viewCallbacks: FavoritesViewCallbacks): void {
  setupFavoriteElement(viewCallbacks.onFavoriteAdded, viewCallbacks.onFavoriteRemoved);
  FavoritesShell.setup(viewCallbacks.onFirstPageFavoritesExtracted);
  FavoritesStatus.setup();
  ContentTiler.setup();
  FavoritesNavigator.setup(viewCallbacks.onPageSelected, viewCallbacks.onRelativePageSelected);
  FavoritesDrawer.setup();
}

export function showSkeleton(): void {
  ContentTiler.tile(FavoritesSkeleton.build());
}

export { toggle as toggleNavigator, getContainer as getNavigationContainer, build as buildNavigationMenu, update as updateNavigationMenu } from "@/features/favorites/view/navigation/navigator";
export { toggle as toggleDrawer } from "@/features/favorites/view/shell/drawer";
export { changeLayout } from "@/app/layout/content_tiler";
export { collectAspectRatios } from "@/features/favorites/view/skeleton/skeleton";
export * from "@/features/favorites/view/thumb_preloader";
export * from "@/features/favorites/view/status/status";
export * from "@/features/favorites/dom_tweaks/ui_toggles";

function toElements(items: Favorite[] | HTMLElement[]): HTMLElement[] {
  if (items.length === 0) {
    return [];
  }
  return items[0] instanceof HTMLElement ? items as HTMLElement[] : (items as Favorite[]).map(f => f.root);
}
