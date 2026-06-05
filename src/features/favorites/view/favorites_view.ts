import * as ContentTiler from "@/app/layout/content_tiler";
import * as FavoritesDrawer from "@/features/favorites/view/shell/drawer";
import * as FavoritesNavigator from "@/features/favorites/view/navigation/navigator";
import * as FavoritesShell from "@/features/favorites/view/shell/favorites_shell";
import * as FavoritesStatus from "@/features/favorites/view/status/status";
import { Favorite, PageRelation } from "@/types/favorite";
import { buildElementTemplate } from "@/features/favorites/types/favorite_element_template";
import { favoritesSkeleton } from "@/features/favorites/view/skeleton/skeleton";
import { scrollToTop } from "@/lib/thumb/thumbs";

export interface FavoritesViewCallbacks {
  onPageSelected: (pageNumber: number) => void;
  onRelativePageSelected: (relation: PageRelation) => void;
  onFirstPageFavoritesExtracted: (elements: HTMLElement[] | undefined) => void;
}

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
  buildElementTemplate();
  FavoritesShell.setup(viewCallbacks.onFirstPageFavoritesExtracted);
  FavoritesStatus.setup();
  ContentTiler.setup();
  ContentTiler.tile(favoritesSkeleton());
  FavoritesNavigator.setup(viewCallbacks);
  FavoritesDrawer.setup();
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
