import * as ContentTiler from "@/app/layout/content_tiler";
import * as FavoritesModel from "@/features/favorites/model/favorites_model";
import * as FavoritesView from "@/features/favorites/view/favorites_view";
import { Content, ScrollSentinelBottom, ScrollSentinelTop } from "@/app/layout/shell";
import { PageBottomObserver, PageTopObserver } from "@/lib/observer/edge_observer";
import { noItemsAreVisible, waitForAllThumbnailsToLoad } from "@/app/layout/content_thumbs";
import { Events } from "@/app/channels/events";
import { Favorite } from "@/types/favorite";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesResultsView } from "@/features/favorites/types/favorite_types";
import { NavigationKey } from "@/types/input";
import { doNothing } from "@/utils/function";
import { isForwardNavigationKey } from "@/types/guards";

const bottomObserver = new PageBottomObserver(extendBelow, getBottomSentinels);
const topObserver = new PageTopObserver(extendAbove, () => [ScrollSentinelTop]);

export const FavoritesInfiniteScrollView = {
  initialize,
  sync: fillIfEmpty,
  reveal: doNothing,
  loadMore: extendInDirection,
  hasMore: FavoritesModel.hasMore
} satisfies FavoritesResultsView;

export function disconnect(): void {
  bottomObserver.disconnect();
  topObserver.disconnect();
}

function getBottomSentinels(): HTMLElement[] {
  const extras = ContentTiler.getBottomEdgeElements();
  return extras.length > 0 ? extras : [ScrollSentinelBottom];
}

async function initialize(favorites: Favorite[]): Promise<void> {
  FavoritesModel.setFavorites(favorites);
  FavoritesView.showSearchResults(FavoritesModel.initialSlice());
  await waitForAllThumbnailsToLoad();
  refreshObservers();
  Events.favorites.pageChanged.emit();
}

function fillIfEmpty(): void {
  if (noItemsAreVisible()) {
    extendBelow();
  }
}

function extendInDirection(direction: NavigationKey): void {
  if (isForwardNavigationKey(direction)) {
    extendBelow();
  } else {
    extendAbove();
  }
}

async function extendBelow(): Promise<void> {
  const { slice, trimmed } = FavoritesModel.expandBelow();

  if (slice.length === 0) {
    return;
  }
  trimAboveAnchoredToBottom(trimmed);
  FavoritesView.addToBottom(slice);
  Events.favorites.favoritesAddedToCurrentPage.emit(slice.map(f => f.root));
  await waitForAllThumbnailsToLoad();
  refreshObservers();
}

function trimAboveAnchoredToBottom(trimmed: Favorite[]): void {
  if (!FavoritesConfig.infiniteScrollWindowed) {
    return;
  }
  const anchor = trimmed[trimmed.length - 1]?.root.nextElementSibling;
  const anchorTopBefore = anchor?.getBoundingClientRect().top ?? 0;

  trimmed.forEach(f => f.root.remove());
  const shift = anchorTopBefore - (anchor?.getBoundingClientRect().top ?? 0);

  window.scrollBy(0, -shift);
}

async function extendAbove(): Promise<void> {
  const { slice, trimmed } = FavoritesModel.expandAbove();

  if (slice.length === 0) {
    return;
  }
  const anchor = Content.firstElementChild;
  const anchorTopBefore = anchor?.getBoundingClientRect().top ?? 0;

  FavoritesView.addToTop(slice);
  const anchorTopAfter = anchor?.getBoundingClientRect().top ?? 0;
  const shift = anchorTopAfter - anchorTopBefore;

  window.scrollBy(0, shift);
  trimmed.forEach(f => f.root.remove());
  Events.favorites.favoritesAddedToCurrentPage.emit(slice.map(f => f.root));
  await waitForAllThumbnailsToLoad();
  refreshObservers();
}

function refreshObservers(): void {
  bottomObserver.refresh();

  if (FavoritesConfig.infiniteScrollWindowed) {
    topObserver.refresh();
  }
}
