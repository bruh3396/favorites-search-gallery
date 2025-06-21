import * as FavoritesModel from "../../../model/favorites_model";
import * as FavoritesView from "../../../view/favorites_view";
import { Events } from "../../../../../lib/global/events/events";
import { FavoritesPageBottomObserver } from "./favorites_page_bottom_observer";
import { FavoritesPresentationFlow } from "../../../types/favorites_presentation_flow_interface";
import { sleep } from "../../../../../utils/misc/async";
import { waitForAllThumbnailsToLoad } from "../../../../../utils/dom/dom";

class InfiniteScrollFlow implements FavoritesPresentationFlow {
  private readonly pageBottomObserver: FavoritesPageBottomObserver;

  constructor() {
    this.pageBottomObserver = new FavoritesPageBottomObserver(this.showMoreResults.bind(this));
  }

  public present(): void {
    this.showFirstResults();
    Events.favorites.pageChanged.emit();
  }

  public onLayoutChanged(): void {
    this.pageBottomObserver.refresh();
  }

  public revealFavorite(): void {
  }

  public reset(): void {
    this.pageBottomObserver.disconnect();
  }

  public handleNewSearchResults(): void {
    if (FavoritesModel.noFavoritesAreVisible()) {
      this.showMoreResults();
    }
  }

  public handlePageChangeRequest(): void {
  }

  private async showMoreResults(): Promise<void> {
    const moreResults = FavoritesModel.getMoreResults();

    if (moreResults.length === 0) {
      return;
    }
    FavoritesView.insertNewSearchResults(moreResults);
    Events.favorites.resultsAddedToCurrentPage.emit(moreResults);
    await waitForAllThumbnailsToLoad();
    this.pageBottomObserver.refresh();
  }

  private async showFirstResults(): Promise<void> {
    FavoritesView.showSearchResults(FavoritesModel.getFirstResults());
    await waitForAllThumbnailsToLoad();
    this.pageBottomObserver.refresh();
    await sleep(50);
  }
}

export const FavoritesInfiniteScrollFlow = new InfiniteScrollFlow();
