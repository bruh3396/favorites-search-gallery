import * as ContentTiler from "@/app/layout/content_tiler";
import * as FavoritesChangelog from "@/features/favorites/view/shell/changelog";
import * as FavoritesDrawer from "@/features/favorites/view/shell/drawer/drawer";
import * as FavoritesHelp from "@/features/favorites/view/shell/help";
import * as FavoritesPaginationRenderer from "@/features/favorites/view/pagination_renderer";
import * as FavoritesShell from "@/features/favorites/view/shell/shell";
import * as FavoritesSkeleton from "@/features/favorites/view/skeleton/skeleton";
import * as FavoritesStatus from "@/features/favorites/view/status/status";
import { Favorite } from "@/types/favorite";
import { FavoritesViewCallbacks } from "@/features/favorites/types/interfaces";
import { buildElementTemplate } from "@/features/favorites/types/favorite_element_template";
import { scrollToTop } from "@/lib/thumb/thumbs";

export function showSearchResults(searchResults: Favorite[]): void {
  ContentTiler.tile(searchResults.map((result) => result.root));
  scrollToTop();
}

export function setup(viewCallbacks: FavoritesViewCallbacks): void {
  buildElementTemplate();
  FavoritesShell.setup();
  FavoritesStatus.setup();
  ContentTiler.setup();
  FavoritesPaginationRenderer.setup(
    viewCallbacks.onPageSelected,
    viewCallbacks.onPageStepped
);
  FavoritesDrawer.setup({
    change: FavoritesChangelog.buildDrawerView(),
    help: FavoritesHelp.buildDrawerView(),
    ...viewCallbacks.drawerViews
  });
}

export const addToTop = (favorites: Favorite[]): void => ContentTiler.addToTop(favorites.map((favorite) => favorite.root));
export const addToBottom = (favorites: Favorite[]): void => ContentTiler.addToBottom(favorites.map((favorite) => favorite.root));
export const showSkeleton = (): void => ContentTiler.tile(FavoritesSkeleton.build());

export { changeLayout } from "@/app/layout/content_tiler";
export { collectAspectRatios } from "@/features/favorites/view/skeleton/skeleton";

export * from "@/features/favorites/view/native_page_cleaner";
export * from "@/features/favorites/view/pagination_renderer";
export * from "@/features/favorites/view/shell/drawer/drawer";
export * from "@/features/favorites/view/status/status";
