class FavoritesInfiniteScrollController extends FavoritesSecondaryController {
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

  showNextBatch() {
    const thumbs = Utils.getThumbsFromPosts(this.model.getNextInfiniteScrollBatch());

    if (thumbs.length === 0) {
      return;
    }
    this.view.insertNewSearchResults(thumbs);
    Events.favorites.resultsAddedToCurrentPage.emit(thumbs);
    Utils.waitForAllThumbnailsToLoad()
      .then(() => {
        this.pageBottomObserver.refresh();
      });
  }

  reset() {
    this.pageBottomObserver.disconnect();
  }
}
