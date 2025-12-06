import * as FavoritesModel from "../../../model/favorites_model";
import * as FavoritesView from "../../../view/favorites_view";
import { Events } from "../../../../../lib/global/events/events";
import { FavoritesPresentationFlow } from "../../../types/favorites_presentation_flow_interface";
import { ON_FAVORITES_PAGE } from "../../../../../lib/global/flags/intrinsic_flags";
import { PageBottomObserver } from "../../../../../lib/components/page_bottom_observer";
import { sleep } from "../../../../../utils/misc/async";
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
    if (FavoritesModel.noFavoritesAreVisible()) {
      this.showMoreResults();
    }
  }

  public revealFavorite(): void { }
  public loadNewFavoritesInGallery(): boolean {
    if (!ON_FAVORITES_PAGE || !FavoritesModel.hasMoreResults()) {
      return false;
    }
    this.showMoreResults();
    return true;
   }

  private async showMoreResults(): Promise<boolean> {
    if (!ON_FAVORITES_PAGE) {
      return false;
    }
    const moreResults = FavoritesModel.getMoreResults();

    if (moreResults.length === 0) {
      return false;
    }
    FavoritesView.insertNewSearchResults(moreResults);
    Events.favorites.favoritesAddedToCurrentPage.emit(moreResults);
    await waitForAllThumbnailsToLoad();
    const urlsToPreload = FavoritesModel.getThumbURLsToPreload();

    FavoritesView.preloadURLs(urlsToPreload);
    this.pageBottomObserver.refresh();
    return true;
  }

  private async showFirstResults(): Promise<void> {
    FavoritesView.showSearchResults(FavoritesModel.getFirstResults());
    await waitForAllThumbnailsToLoad();
    this.pageBottomObserver.refresh();
    await sleep(50);
  }
}

export const FavoritesInfiniteScrollFlow = new InfiniteScrollFlow();
