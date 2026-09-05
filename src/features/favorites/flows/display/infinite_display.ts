import * as ContentTiler from "@/app/layout/content_tiler";
import * as FavoritesView from "@/features/favorites/view/view";
import { ContentDisplayOptions } from "@/types/ui";
import { Favorite } from "@/types/favorite";
import { FavoritesBottomEdgeObserver } from "@/features/favorites/flows/display/edge_observer";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesDisplay } from "@/features/favorites/types/types";
import { ScrollSentinelBottom } from "@/app/layout/shell";
import { doNothing } from "@/utils/pure/function";
import { waitForAllThumbsToLoad } from "@/app/layout/content_thumbs";

const bottomObserver = new FavoritesBottomEdgeObserver(extendBelow, () => [...ContentTiler.bottomEdgeElements(), ScrollSentinelBottom]);
let favorites: Favorite[] = [];
let displayedCount = 0;

export const FavoritesInfiniteDisplay = {
  initialize,
  sync,
  advance,
  goToPage: doNothing,
  teardown: (): void => bottomObserver.disconnect()
} satisfies FavoritesDisplay;

async function initialize(newFavorites: Favorite[], options?: ContentDisplayOptions): Promise<void> {
  favorites = newFavorites;
  displayedCount = 0;
  FavoritesView.showSearchResults(takeNextBatch(), options);
  await waitForAllThumbsToLoad();
  bottomObserver.refresh();
}

function sync(newFavorites: Favorite[]): void {
  const wasExhausted = !hasMore();

  favorites.push(...newFavorites);

  if (wasExhausted && hasMore()) {
    bottomObserver.refresh();
  }
}

async function extendBelow(): Promise<boolean> {
  if (!advance()) {
    return false;
  }
  await waitForAllThumbsToLoad();
  return hasMore();
}

function advance(): boolean {
  const batch = takeNextBatch();

  if (batch.length === 0) {
    return false;
  }
  FavoritesView.addToBottom(batch);
  return true;
}

function takeNextBatch(): Favorite[] {
  const batch = favorites.slice(displayedCount, displayedCount + FavoritesConfig.infiniteScrollSliceSize);

  displayedCount += batch.length;
  return batch;
}

function hasMore(): boolean {
  return displayedCount < favorites.length;
}
