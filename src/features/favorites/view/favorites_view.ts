import * as ContentTiler from "@/app/layout/content_tiler";
import * as FavoritesChangelog from "@/features/favorites/view/shell/changelog";
import * as FavoritesDrawer from "@/features/favorites/view/shell/drawer";
import * as FavoritesHelp from "@/features/favorites/view/shell/help";
import * as FavoritesPaginationRenderer from "@/features/favorites/view/pagination_renderer";
import * as FavoritesShell from "@/features/favorites/view/shell/shell";
import * as FavoritesSkeleton from "@/features/favorites/view/skeleton/skeleton";
import * as FavoritesStatus from "@/features/favorites/view/status/status";
import { ContentDisplayOptions } from "@/types/ui";
import { Favorite } from "@/types/favorite";
import { FavoritesViewDependencies } from "@/features/favorites/types/types";
import { ON_MOBILE_DEVICE } from "@/lib/environment";
import { buildFavoriteElementTemplate } from "@/features/favorites/types/favorite_element_template";
import { doNothing } from "@/utils/pure/function";

let onContentReplaced: () => void = doNothing;
let onContentAdded: (favorites: Favorite[]) => void = doNothing;

export function showSearchResults(searchResults: Favorite[], options: ContentDisplayOptions = { fade: true }): void {
  ContentTiler.tile(searchResults.map((result) => result.root), options);
  window.scrollTo(0, ON_MOBILE_DEVICE ? 10 : 0);
  onContentReplaced();
}

export function setup(dependencies: FavoritesViewDependencies): void {
  onContentReplaced = dependencies.onContentReplaced;
  onContentAdded = dependencies.onContentAdded;
  buildFavoriteElementTemplate();
  FavoritesShell.setup();
  FavoritesStatus.setup();
  ContentTiler.setup();
  FavoritesPaginationRenderer.setup(dependencies.onPageSelected, dependencies.onPageStepped);
  FavoritesDrawer.setup({
    change: FavoritesChangelog.buildDrawerView(),
    help: FavoritesHelp.buildDrawerView(),
    ...dependencies.drawerViews
  }, dependencies.onDrawerOpen, dependencies.onDrawerViewSelected);
}

export function addToTop(favorites: Favorite[]): void {
  ContentTiler.addToTop(favorites.map((favorite) => favorite.root));
  onContentAdded(favorites);
}

export function addToBottom(favorites: Favorite[]): void {
  ContentTiler.addToBottom(favorites.map((favorite) => favorite.root));
  onContentAdded(favorites);
}

export const showSkeleton = (): void => ContentTiler.tile(FavoritesSkeleton.build());

export { changeLayout } from "@/app/layout/content_tiler";
export { collectAspectRatios } from "@/features/favorites/view/skeleton/skeleton";
export { takeNativeFavorites, removeOriginalUnusedScripts } from "@/features/favorites/view/native_page_cleaner";
export { togglePaginator, isGotoPagePopoverTarget, closeGotoPagePopover, buildPaginator, updatePaginator } from "@/features/favorites/view/pagination_renderer";
export { toggle as toggleDrawer } from "@/features/favorites/view/shell/drawer";
export { setStatus, setTemporaryStatus, setResultsCount as setMatchCount, updateFetchStatus, notifyNewFavoritesFound, setExpectedTotalFavoritesCount } from "@/features/favorites/view/status/status";
