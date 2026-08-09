import * as ContentTiler from "@/app/layout/content_tiler";
import * as FavoritesView from "@/features/favorites/view/favorites_view";
import { BottomEdgeObserver } from "@/lib/observer/edge_observer";
import { Events } from "@/app/channels/events";
import { Favorite } from "@/types/favorite";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesResultsView } from "@/features/favorites/types/types";
import { ScrollSentinelBottom } from "@/app/layout/shell";
import { SlidingWindow } from "@/lib/collection/sliding_window";
import { doNothing } from "@/utils/function";
import { waitForAllThumbsToLoad } from "@/app/layout/content_thumbs";

const bottomObserver = new BottomEdgeObserver(extendBelow, () => [...ContentTiler.bottomEdgeElements(), ScrollSentinelBottom]);
const slidingWindow = new SlidingWindow<Favorite>(FavoritesConfig.infiniteScrollSliceSize);

export const FavoritesInfiniteScrollView = {
  initialize,
  sync,
  reveal: doNothing,
  loadMore
} satisfies FavoritesResultsView;

export function disconnect(): void {
  bottomObserver.disconnect();
}

async function initialize(favorites: Favorite[]): Promise<void> {
  slidingWindow.reset(favorites);
  FavoritesView.showSearchResults(slidingWindow.nextSlice());
  await waitForAllThumbsToLoad();
  bottomObserver.refresh();
  Events.favorites.pageChanged.emit();
}

 function sync(newFavorites: Favorite[]): void {
    const wasExhausted = !slidingWindow.hasMore();

    slidingWindow.append(newFavorites);

    if (wasExhausted && slidingWindow.hasMore()) {
      bottomObserver.refresh();
    }
  }

function loadMore(): boolean {
  const slice = slidingWindow.nextSlice();

  if (slice.length === 0) {
    return false;
  }
  appendSlice(slice);
  return true;
}

async function extendBelow(): Promise<boolean> {
  const slice = slidingWindow.nextSlice();

  if (slice.length === 0) {
    return false;
  }
  appendSlice(slice);
  await waitForAllThumbsToLoad();
  return slidingWindow.hasMore();
}

function appendSlice(slice: Favorite[]): void {
  FavoritesView.addToBottom(slice);
  Events.favorites.favoritesAddedToCurrentPage.emit(slice);
}
