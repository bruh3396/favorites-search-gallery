import * as FavoritesModel from "../../model/model";
import * as FavoritesView from "../../view/view";
import {ITEM_SELECTOR, waitForAllThumbnailsToLoad} from "../../../../utils/dom/dom";
import {Events} from "../../../../lib/functional/events";
import {FAVORITES_CONTENT_CONTAINER} from "../../page_builder/content";
import {FavoritesPageBottomObserver} from "./page_bottom_observer";
import {FavoritesPresenter} from "./presenter";
import {sleep} from "../../../../utils/misc/generic";

class InfiniteScrollPresenter implements FavoritesPresenter {
  private readonly pageBottomObserver: FavoritesPageBottomObserver;

  constructor() {
    this.pageBottomObserver = new FavoritesPageBottomObserver(this.showMoreResults.bind(this));
  }

  public present(): void {
    FavoritesView.clear();
    this.showMoreResults();
    Events.favorites.pageChanged.emit();
  }

  public changeLayout(): void {
    this.pageBottomObserver.refresh();
  }

  public revealFavorite(): void {
  }

  public reset(): void {
    this.pageBottomObserver.disconnect();
  }

  public handleNewSearchResults(): void {
    if (FAVORITES_CONTENT_CONTAINER.querySelector(ITEM_SELECTOR) === null) {
      this.showMoreResults();
    }
  }

  private async showMoreResults(): Promise<void> {
    const thumbs = FavoritesModel.getMoreResults().map(favorite => favorite.root);

    if (thumbs.length === 0) {
      return;
    }
    // FetchQueues.imageRequest.pause();
    await sleep(25);
    FavoritesView.insertNewSearchResults(thumbs);
    Events.favorites.resultsAddedToCurrentPage.emit(thumbs);
    // await Utils.sleep(25);
    await waitForAllThumbnailsToLoad();
    this.pageBottomObserver.refresh();
    await sleep(50);
    // FetchQueues.imageRequest.resume();

  }

  public handlePageChangeRequest(): void {
  }
}

export const FavoritesInfiniteScrollPresenter = new InfiniteScrollPresenter();
