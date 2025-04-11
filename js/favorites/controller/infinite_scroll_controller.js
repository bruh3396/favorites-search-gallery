class FavoritesInfiniteScrollController extends FavoritesDisplayController {
  /** @type {FavoritesPageBottomObserver} */
  pageBottomObserver;

  /**
   *
   * @param {FavoritesModel} model
   * @param {FavoritesView} view
   */
  constructor(model, view) {
    super(model, view);
    this.pageBottomObserver = this.createPageBottomObserver();
  }

  /**
   * @returns {FavoritesPageBottomObserver}
   */
  createPageBottomObserver() {
    return new FavoritesPageBottomObserver(() => {
      this.showNextBatch();
    });
  }
  showSearchResults() {
    this.view.clear();
    this.showNextBatch();
    Events.favorites.pageChanged.emit();
  }

  handleBottomOfPageReached() {
    this.showNextBatch();
  }

  handleNewSearchResultsFound() {
    if (document.querySelector(`.${Utils.itemClassName}`) === null) {
      this.showNextBatch();
    }
  }

  changeLayout() {
    this.pageBottomObserver.refresh();
  }

  async showNextBatch() {
    const thumbs = Utils.getThumbsFromPosts(this.model.getNextInfiniteScrollBatch());

    if (thumbs.length === 0) {
      return;
    }
    FetchQueues.imageRequest.pause();
    await Utils.sleep(25);
    this.view.insertNewSearchResults(thumbs);
    Events.favorites.resultsAddedToCurrentPage.emit(thumbs);
    await Utils.sleep(25);
    await Utils.waitForAllThumbnailsToLoad();
    this.pageBottomObserver.refresh();
    await Utils.sleep(50);
    FetchQueues.imageRequest.resume();
  }

  reset() {
    this.pageBottomObserver.disconnect();
  }
}
