class FavoritesView {
  /**
   * @type {FavoritesPaginator}
   */
  paginator;
  /**
   * @type {FavoritesStatusBar}
   */
  statusBar;

  /**
   * @param {{onPageChange: Function, onLayoutCompleted: Function}} callbacks
   */
  constructor({onPageChange, onLayoutCompleted}) {
    this.paginator = new FavoritesPaginator(onPageChange, onLayoutCompleted);
    this.statusBar = new FavoritesStatusBar();
  }

  clearOriginalFavorites() {
    const thumbs = Array.from(document.getElementsByClassName("thumb"));
    let content = document.getElementById("content");

    if (content === null && thumbs.length > 0) {
      content = thumbs[0].closest("body>div");
    }

    if (content !== null) {
      content.remove();
    }
  }

  hideLoadingWheel() {
    Utils.insertStyleHTML(`
      #loading-wheel {
        display: none;
      }
      `, "loading-wheel-display");
  }

  /**
   * @param {String} message
   */
  showNotification(message) {
    this.statusBar.setStatus(message);
  }

  /**
   * @param {{searchResults: Post[], allFavorites: Post[]}} parameter
   * @returns {HTMLElement[]}
   */
  updateSearchResultsWhileFetching({searchResults, allFavorites}) {
    this.statusBar.updateStatusWhileFetching(searchResults.length, allFavorites.length);
    return this.paginator.paginateWhileFetching(searchResults);
  }

  /**
   * @param {{newSearchResults: Post[], newFavorites: Post[], allSearchResults: Post[]}} results
   */
  insertNewSearchResultsOnReload(results) {
    this.paginator.insertNewSearchResults(results);
    const newFavoritesCount = results.newFavorites.length;

    if (newFavoritesCount > 0) {
      const pluralSuffix = newFavoritesCount > 1 ? "s" : "";

      this.showNotification(`Found ${newFavoritesCount} new favorite${pluralSuffix}`);
    }
  }

  /**
   * @param {"masonry" | "row" | "square" | "grid" } layout
   */
  changeLayout(layout) {
    this.paginator.changeLayout(layout);
  }

  /**
   * @param {HTMLInputElement} input
   */
  updateColumnCount(input) {
    this.paginator.updateColumnCount(input);
  }

  /**
   * @param {HTMLInputElement} input
   */
  updateRowSize(input) {
    this.paginator.updateRowSize(input);
  }

  /**
   * @param {Post[]} searchResults
   */
  showSearchResults(searchResults) {
    this.statusBar.setMatchCount(searchResults.length);
    this.paginator.paginate(searchResults);
  }

  /**
   * @param {Number} resultsPerPage
   */
  updateResultsPerPage(resultsPerPage) {
    this.paginator.updateResultsPerPage(resultsPerPage);
  }

  /**
   * @param {{direction: String, searchResults: Post[]}} message
   * @returns {Boolean}
   */
  changePageInGallery(message) {
    return this.paginator.changePageWhileInGallery(message.direction, message.searchResults);
  }

  gotoNextPage() {
    this.paginator.gotoNextPage();
  }

  /**
   * @param {String} id
   * @param {Post[]} searchResults
   */
  findFavorite(id, searchResults) {
    this.paginator.findFavorite(id, searchResults);
  }
}
