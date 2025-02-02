class FavoritesView {
  /**
   * @type {EventEmitter}
   */
  network;
  /**
   * @type {FavoritesPaginator}
   */
  paginator;
  /**
   * @type {FavoritesStatusBar}
   */
  statusBar;

  /**
   * @param {EventEmitter} network
   */
  constructor(network) {
    this.network = network;
    this.paginator = new FavoritesPaginator(() => {
      this.network.sendMessage(Channels.favorites.viewToController, "onPageChanged", {});
    });
    this.statusBar = new FavoritesStatusBar();
    this.network.on(Channels.favorites.controllerToView, (/** @type {Message} */ message) => Utils.handleMessage(this, message));
  }

  clearOriginalFavoritesContent() {
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
   */
  updateSearchResultsWhileFetching({searchResults, allFavorites}) {
    this.statusBar.updateStatusWhileFetching(searchResults.length, allFavorites.length);
    this.paginator.paginateWhileFetching(searchResults);
  }

  /**
   * @param {{newSearchResults: Post[], newFavoritesCount: Number}} parameter
   */
  insertNewSearchResultsOnReload({newSearchResults, newFavoritesCount}) {
    this.paginator.insertNewSearchResults(newSearchResults.reverse());

    if (newFavoritesCount > 0) {
      const pluralSuffix = newFavoritesCount > 1 ? "s" : "";

      this.showNotification(`Found ${newFavoritesCount} new favorite${pluralSuffix}`);
    }
  }

  /**
   * @param {"grid" | "row" | "masonry"} layout
   */
  changeLayout(layout) {
    this.network.sendMessage(Channels.favorites.viewToController, "onLayoutChanged", layout === "masonry");
    this.paginator.changeLayout(layout);
  }

  /**
   * @param {HTMLInputElement} input
   */
  updateColumnCount(input) {
    this.paginator.updateColumnCount(input);
  }

  /**
   * @param {Post[]} favorites
   */
  showSearchResults(favorites) {
    this.statusBar.setMatchCount(favorites.length);
    this.paginator.paginate(favorites);
  }

  /**
   * @param {HTMLInputElement} input
   */
  updateResultsPerPage(input) {
    this.paginator.updateResultsPerPage(parseInt(input.value));
  }

  /**
   * @param {{direction: String, searchResults: Post[]}} message
   */
  changePageInGallery(message) {
    const success = this.paginator.changePageWhileInGallery(message.direction, message.searchResults);

    if (!success) {
      this.network.sendMessage(Channels.favorites.viewToController, "didNotChangePageWhileInGallery", message.direction);
    }
  }
}
