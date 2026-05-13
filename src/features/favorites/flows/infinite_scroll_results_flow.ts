import * as FavoritesModel from "../model/favorites_model";
import * as FavoritesView from "../view/favorites_view";
import { noItemsAreVisible, waitForAllThumbnailsToLoad } from "../../../lib/dom/content_thumb";
import { Events } from "../../../lib/communication/events";
import { Favorite } from "../../../types/favorite";
import { FavoritesResultsView } from "../types/favorite_types";
import { PageBottomObserver } from "../../../lib/core/observers/page_bottom_observer";
import { doNothing } from "../../../lib/environment/constants";

const pageBottomObserver = new PageBottomObserver(appendNextSlice);

export const FavoritesInfiniteView = {
  initialize,
  sync: ensureVisibility,
  reveal: doNothing,
  loadMore: appendNextSlice,
  hasMore: (): boolean => FavoritesView.hasMoreSlices(FavoritesModel.getCurrentSearchResults())
} satisfies FavoritesResultsView;

export function disconnect(): void {
  pageBottomObserver.disconnect();
}

async function initialize(favorites: Favorite[]): Promise<void> {
  FavoritesView.showSearchResults(FavoritesView.getInitialSlice(favorites));
  await waitForAllThumbnailsToLoad();
  pageBottomObserver.refresh();
  Events.favorites.pageChanged.emit();
}

function ensureVisibility(): void {
  if (noItemsAreVisible()) {
    appendNextSlice();
  }
}

async function appendNextSlice(): Promise<void> {
  const slice = FavoritesView.getNextSlice(FavoritesModel.getCurrentSearchResults());

  if (slice.length === 0) {
    return;
  }
  FavoritesView.addToBottom(slice);
  Events.favorites.favoritesAddedToCurrentPage.emit(slice);
  await waitForAllThumbnailsToLoad();
  FavoritesView.preloadImages(FavoritesView.getThumbUrlsToPreload(FavoritesModel.getCurrentSearchResults()));
  pageBottomObserver.refresh();
}
