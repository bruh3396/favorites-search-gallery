class FavoritesView {
  /** @type {FavoritesPaginationMenu} */
  paginator;
  /** @type {FavoritesStatusBar} */
  statusBar;
  /** @type {FavoritesTiler} */
  tiler;

  constructor() {
    this.tiler = new FavoritesTiler();
    this.statusBar = new FavoritesStatusBar();
    this.paginator = new FavoritesPaginationMenu();
    this.clearOriginalContent();
  }

  clearOriginalContent() {
    this.getOriginalContent()?.remove();
  }

  /**
   * @returns {HTMLElement | null}
   */
  getOriginalContent() {
    return document.querySelector("#content, div:has(.thumb)");
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
   * @param {Number} searchResultCount
   * @param {Number} totalFavoritesCount
   */
  updateStatusWhileFetching(searchResultCount, totalFavoritesCount) {
    this.statusBar.updateStatusWhileFetching(searchResultCount, totalFavoritesCount);
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  insertNewSearchResults(thumbs) {
    this.tiler.addToBottom(thumbs);
  }

  /**
   * @param {{newSearchResults: Post[], newFavorites: Post[], allSearchResults: Post[]}} results
   */
  insertNewSearchResultsOnReload(results) {
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
   * @param {FavoriteLayout} layout
   */
  changeLayout(layout) {
    this.tiler.changeLayout(layout);
  }

  /**
   * @param {Number} columnCount
   */
  updateColumnCount(columnCount) {
    this.tiler.updateColumnCount(columnCount);
  }

  /**
   * @param {Number} rowSize
   */
  updateRowSize(rowSize) {
    this.tiler.updateRowSize(rowSize);
  }

  /**
   * @param {Post[]} searchResults
   */
  showSearchResults(searchResults) {
    this.tiler.tile(Utils.getThumbsFromPosts(searchResults));
    Utils.scrollToTop();
  }

  clear() {
    this.showSearchResults([]);
  }

  /**
   * @param {Number} matchCount
   */
  setMatchCount(matchCount) {
    this.statusBar.setMatchCount(matchCount);
  }

  /**
   * @param {FavoritesPaginationParameters} parameters
   */
  createPageSelectionMenu(parameters) {
    this.paginator.create(parameters);
  }

  /**
   * @param {FavoritesPaginationParameters} parameters
   */
  createPageSelectionMenuWhileFetching(parameters) {
    this.paginator.update(parameters);
  }

  /**
   * @param {String} id
   */
  async revealFavorite(id) {
    await Utils.waitForAllThumbnailsToLoad();
    const thumb = document.getElementById(id);

    if (thumb === null || thumb.classList.contains("blink")) {
      return;
    }
    thumb.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
    thumb.classList.add("blink");
    await Utils.sleep(1500);
    thumb.classList.remove("blink");
  }

  /**
   * @returns {HTMLElement}
   */
  getPaginationMenu() {
    return this.paginator.container;
  }

  /**
   * @param {Boolean} value
   */
  togglePaginationMenu(value) {
    this.paginator.toggle(value);
  }
}
