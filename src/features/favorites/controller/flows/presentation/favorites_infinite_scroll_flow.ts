import * as FavoritesModel from "../../../model/favorites_model";
import * as FavoritesView from "../../../view/favorites_view";
import { Events } from "../../../../../lib/communication/events";
import { FavoritesPresentationFlow } from "../../../types/favorite_types";
import { ON_FAVORITES_PAGE } from "../../../../../lib/environment/environment";
import { PageBottomObserver } from "../../../../../lib/core/observers/page_bottom_observer";
import { sleep } from "../../../../../lib/core/async/promise";
import { waitForAllThumbnailsToLoad } from "../../../../../utils/dom/dom";

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
    if (FavoritesView.noFavoritesAreVisible()) {
      this.showMoreResults();
    }
  }

  public revealFavorite(): void { }
  public loadNewFavoritesInGallery(): boolean {
    if (!ON_FAVORITES_PAGE || !FavoritesView.hasMoreResults(FavoritesModel.getLatestSearchResults())) {
      return false;
    }
    this.showMoreResults();
    return true;
   }

  private async showMoreResults(): Promise<boolean> {
    if (!ON_FAVORITES_PAGE) {
      return false;
    }
    const moreResults = FavoritesView.getMoreResults(FavoritesModel.getLatestSearchResults());

    if (moreResults.length === 0) {
      return false;
    }
    FavoritesView.insertNewSearchResults(moreResults);
    Events.favorites.favoritesAddedToCurrentPage.emit(moreResults);
    await waitForAllThumbnailsToLoad();
    const urlsToPreload = FavoritesView.getThumbURLsToPreload(FavoritesModel.getLatestSearchResults());

    FavoritesView.preloadImages(urlsToPreload);
    this.pageBottomObserver.refresh();
    return true;
  }

  private async showFirstResults(): Promise<void> {
    FavoritesView.showSearchResults(FavoritesView.getFirstResults(FavoritesModel.getLatestSearchResults()));
    await waitForAllThumbnailsToLoad();
    this.pageBottomObserver.refresh();
    await sleep(50);
  }
}

export const FavoritesInfiniteScrollFlow = new InfiniteScrollFlow();
