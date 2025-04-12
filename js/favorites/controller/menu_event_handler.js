class FavoritesMenuEventHandler {
  /* eslint-disable func-names */
  static {
    FavoritesController.prototype.addEventListenersToMainMenu = function() {
      this.addButtonEventListenersToMainMenu();
      this.addCheckboxEventListenersToMainMenu();
      this.addNumericEventListenersToMainMenu();
      this.addOtherEventListenersToMainMenu();
    };

    FavoritesController.prototype.addButtonEventListenersToMainMenu = function() {
      Events.favorites.searchStarted.on((searchQuery) => {
        this.searchFavorites(searchQuery);
      });
      Events.favorites.shuffleButtonClicked.on(() => {
        this.showSearchResults(this.model.getShuffledSearchResults());
      });
      Events.favorites.invertButtonClicked.on(() => {
        this.model.invertSearchResults();
        this.showSearchResults(this.model.getLatestSearchResults());
      });
      Events.favorites.resetButtonClicked.on(() => {
        if (Utils.askToReset()) {
          Utils.clearLocalStorage();
          Events.favorites.reset.emit();
        }
      });
    };

    FavoritesController.prototype.addCheckboxEventListenersToMainMenu = function() {
      Events.favorites.sortAscendingToggled.on((value) => {
        this.model.toggleSortAscending(value);
        this.showSearchResults(this.model.getSearchResultsFromPreviousQuery());
      });
      Events.favorites.blacklistToggled.on((value) => {
        this.model.toggleBlacklist(value);
        this.showSearchResults(this.model.getSearchResultsFromPreviousQuery());
      });
      Events.favorites.infiniteScrollToggled.on((value) => {
        this.toggleInfiniteScroll(value);
      });
    };

    FavoritesController.prototype.addNumericEventListenersToMainMenu = function() {
      Events.favorites.columnCountChanged.on((columnCount) => {
        this.view.updateColumnCount(columnCount);
        Events.favorites.favoritesResized.emit();
      });
      Events.favorites.rowSizeChanged.on((rowSize) => {
        this.view.updateRowSize(rowSize);
        Events.favorites.favoritesResized.emit();
      });
      Events.favorites.resultsPerPageChanged.on((resultsPerPage) => {
        this.model.changeResultsPerPage(resultsPerPage);
        this.showSearchResults(this.model.getSearchResultsFromPreviousQuery());
      });
    };

    FavoritesController.prototype.addOtherEventListenersToMainMenu = function() {
      Events.favorites.sortingMethodChanged.on((sortingMethod) => {
        this.model.setSortingMethod(sortingMethod);
        this.showSearchResults(this.model.getSearchResultsFromPreviousQuery());
      });
      Events.favorites.layoutChanged.on((layout) => {
        this.view.changeLayout(layout);
      });
      Events.favorites.performanceProfileChanged.on(() => {
        window.location.reload();
      });
      Events.favorites.allowedRatingsChanged.on((allowedRatings) => {
        this.model.changeAllowedRatings(allowedRatings);
        this.showSearchResults(this.model.getSearchResultsFromPreviousQuery());
      });
      Events.favorites.searchSubsetClicked.on(() => {
        this.model.setSearchSubset();
      });
      Events.favorites.stopSearchSubsetClicked.on(() => {
        this.model.stopSearchSubset();
      });
      Events.favorites.findFavoriteStarted.on((id) => {
        this.findFavorite(id);
      });
      Events.favorites.findFavoriteInAllStarted.on((id) => {
        this.searchFavorites("");
        this.findFavorite(id);
      });
    };
  }
}
