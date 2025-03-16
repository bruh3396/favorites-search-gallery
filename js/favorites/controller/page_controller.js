class FavoritesPaginationController extends FavoritesSecondaryController {
  /**
   * @param {CustomEvent} event
   */
  handlePaginationMenuEvent(event) {
    if (!(event.target instanceof HTMLElement)) {
      return;
    }
    const action = event.target.dataset.action;

    if (action === "gotoPage") {
      this.model.changePage(parseInt(event.detail));
      this.showCurrentPage();
      return;
    }

    if (action === "gotoRelativePage" && this.model.gotoRelativePage(event.detail)) {
      this.showCurrentPage();
    }
  }

  handleNewSearchResultsFound() {
    this.model.paginate(this.model.getLatestSearchResults());
    this.view.createPageSelectionMenuWhileFetching(this.model.getPaginationParameters());
    this.addNewlyFetchedSearchResultsToCurrentPage();
    Events.favorites.newSearchResults.emit(this.model.getLatestSearchResults());
  }

  addNewlyFetchedSearchResultsToCurrentPage() {
    if (!this.model.onFinalPage()) {
      return;
    }
    const newFavorites = this.model.getFavoritesOnCurrentPage()
      .filter(favorite => document.getElementById(favorite.id) === null);
    const thumbs = Utils.getThumbsFromPosts(newFavorites);

    this.view.insertNewSearchResults(thumbs);
    Events.favorites.resultsAddedToCurrentPage.emit(thumbs);
  }

  /**
   * @param {Post[]} searchResults
   */
  showSearchResults(searchResults) {
    this.model.paginate(searchResults);
    this.model.changePage(1);
    this.showCurrentPage();
  }

  showCurrentPage() {
    this.view.showSearchResults(this.model.getFavoritesOnCurrentPage());
    this.view.createPageSelectionMenu(this.model.getPaginationParameters());
    Events.favorites.pageChange.emit();
  }

  /**
   * @param {String} id
   */
  findFavorite(id) {
    if (this.model.gotoPageWithFavorite(id)) {
      this.showCurrentPage();
    }
    this.view.revealFavorite(id);
  }

  /**
   * @param {NavigationKey} direction
   */
  handlePageChangeRequest(direction) {
    this.gotoAdjacentPage(direction);
    Events.favorites.pageChangeResponse.emit();
  }

  /**
   * @param {NavigationKey} direction
   */
  gotoAdjacentPage(direction) {
    if (this.model.gotoAdjacentPage(direction)) {
      this.showCurrentPage();
    }
  }
}
