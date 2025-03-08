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
   * @type {FavoritesTiler}
   */
  tiler;

  /**
   * @param {{onPageChange: Function, onLayoutCompleted: Function}} callbacks
   */
  constructor({onPageChange, onLayoutCompleted}) {
    this.tiler = new FavoritesTiler(onLayoutCompleted);
    this.statusBar = new FavoritesStatusBar();
    this.paginator = this.createPaginator(onPageChange);
  }

  /**
   * @param {Function} onPageChange
   * @returns {FavoritesPaginator}
   */
  createPaginator(onPageChange) {
    return new FavoritesPaginator((/** @type {Post[]} */ favorites) => {
      Utils.scrollToTop();
      this.tiler.tile(Utils.getThumbsFromPosts(favorites));
      onPageChange();
      this.tiler.alertLayoutCompleted();
    });
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
    const addedSearchResults = this.paginator.paginateWhileFetching(searchResults);
    const thumbs = Utils.getThumbsFromPosts(addedSearchResults);

    this.tiler.addToBottom(thumbs);
    return thumbs;
  }

  /**
   * @param {{newSearchResults: Post[], newFavorites: Post[], allSearchResults: Post[]}} results
   */
  insertNewSearchResultsOnReload(results) {
    this.paginator.updatePaginationMenuWHenNewFavoritesAddedOnReload(results.allSearchResults);
    this.tiler.addToTop(Utils.getThumbsFromPosts(results.newSearchResults));
    this.notifyNewFavoritesFound(results.newFavorites.length);
  }

  /**
   * @param {Number} newFavoritesCount
   */
  notifyNewFavoritesFound(newFavoritesCount) {
    if (newFavoritesCount > 0) {
      const pluralSuffix = newFavoritesCount > 1 ? "s" : "";

      this.showNotification(`Found ${newFavoritesCount} new favorite${pluralSuffix}`);
    }
  }

  /**
   * @param {FavoritesLayout} layout
   */
  changeLayout(layout) {
    this.tiler.changeLayout(layout);
  }

  /**
   * @param {HTMLInputElement} input
   */
  updateColumnCount(input) {
    this.tiler.updateColumnCount(parseFloat(input.value));
  }

  /**
   * @param {HTMLInputElement} input
   */
  updateRowSize(input) {
    const rowSize = parseFloat(input.value);
    const minRowSize = parseInt(input.getAttribute("min") || "1");
    const maxRowSize = parseInt(input.getAttribute("max") || "5");

    this.tiler.updateRowSize(rowSize, minRowSize, maxRowSize);
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

  /**
   * @param {String} direction
   */
  changePageOutOfGallery(direction) {
    this.paginator.gotoAdjacentPage(direction);
  }

  /**
   * @param {String} id
   * @param {Post[]} searchResults
   */
  findFavorite(id, searchResults) {
    this.paginator.findFavorite(id, searchResults);
  }
}
