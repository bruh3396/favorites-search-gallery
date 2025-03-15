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
    this.clearOriginalFavorites();
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
    // this.paginator.updatePaginationMenuWHenNewFavoritesAddedOnReload(results.allSearchResults);
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
