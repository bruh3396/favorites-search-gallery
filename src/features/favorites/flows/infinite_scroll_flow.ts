import * as FavoritesModel from "../model/favorites_model";
import * as FavoritesView from "../view/favorites_view";
import { noItemsAreVisible, waitForAllThumbnailsToLoad } from "../../../lib/dom/content_thumb";
import { Events } from "../../../lib/communication/events";
import { FavoritesPresentationFlow } from "../types/favorite_types";
import { PageBottomObserver } from "../../../lib/core/observers/page_bottom_observer";

class InfiniteScrollFlow implements FavoritesPresentationFlow {
  private readonly pageBottomObserver: PageBottomObserver;

  constructor() {
    this.pageBottomObserver = new PageBottomObserver(this.showMoreResults.bind(this));
  }

  public present(): void {
    this.showFirstResults();
    Events.favorites.pageChanged.emit();
  }

  public onLayoutChanged(): void {
    this.pageBottomObserver.refresh();
  }

  public reset(): void {
    this.pageBottomObserver.disconnect();
  }

  public handleNewSearchResults(): void {
    if (noItemsAreVisible()) {
      this.showMoreResults();
    }
  }

  public reveal(): void { }

  public presentWhileNavigatingGallery(): boolean {
    if (!FavoritesView.hasMoreResults(FavoritesModel.getLatestSearchResults())) {
      return false;
    }
    this.showMoreResults();
    return true;
  }

  private async showMoreResults(): Promise<void> {
    const moreResults = FavoritesView.getMoreResults(FavoritesModel.getLatestSearchResults());

    if (moreResults.length > 0) {
      FavoritesView.addToBottom(moreResults);
      Events.favorites.favoritesAddedToCurrentPage.emit(moreResults);
      await waitForAllThumbnailsToLoad();
      FavoritesView.preloadImages(FavoritesView.getThumbUrlsToPreload(FavoritesModel.getLatestSearchResults()));
      this.pageBottomObserver.refresh();
    }
  }

  private async showFirstResults(): Promise<void> {
    FavoritesView.showSearchResults(FavoritesView.getFirstResults(FavoritesModel.getLatestSearchResults()));
    await waitForAllThumbnailsToLoad();
    this.pageBottomObserver.refresh();
  }
}

export const FavoritesInfiniteScrollFlow = new InfiniteScrollFlow();
