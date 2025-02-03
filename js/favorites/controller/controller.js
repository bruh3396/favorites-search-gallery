class FavoritesController {
  static get disabled() {
    return !Utils.onFavoritesPage();
  }
  /**
   * @type {FavoritesModel}
   */
  // @ts-ignore
  model;
  /**
   * @type {FavoritesView}
   */
  // @ts-ignore
  view;
  /**
   * @type {Boolean}
   */
  // @ts-ignore
  changedPageOnce;

  constructor() {
    if (FavoritesController.disabled) {
      return;
    }
    this.model = new FavoritesModel();
    this.view = new FavoritesView({
      onPageChange: this.onPageChange.bind(this)
    });
    this.changedPageOnce = false;
    this.listenToMenuEvents();
    this.listenToGlobalEvents();
    this.view.clearOriginalFavorites();
    this.loadAllFavorites();
  }

  onPageChange() {
    if (this.changedPageOnce) {
      Utils.broadcastEvent("changedPage");
    }
    this.changedPageOnce = true;
  }

  listenToMenuEvents() {
    const menu = document.getElementById("favorites-search-gallery-menu");

    if (menu !== null) {
      // @ts-ignore
      menu.addEventListener("controller", Utils.debounce((/** @type {CustomEvent} */ event) => {
        if (!(event.target instanceof HTMLElement)) {
          return;
        }
        const action = event.target.dataset.action || "none";

        if (typeof this[action] === "function") {
          this[action](event.detail);
        }
      }, 50));
    }
  }

  listenToGlobalEvents() {
    // @ts-ignore
    window.addEventListener("reachedEndOfGallery", (/** @type {CustomEvent} */event) => {
      const direction = event.detail;
      const success = this.view.changePageInGallery({
        direction,
        searchResults: this.model.getLatestSearchResults()
      });

      if (!success) {
        this.didNotChangePageWhileInGallery(direction);
      }
    });
    // window.addEventListener("missingMetadata", (event) => {
    //   this.model.addMissingMetadata(event.detail);
    // });
  }

  loadAllFavorites() {
    this.model.loadAllFavorites()
      .then((searchResults) => {
        this.processLoadedSearchResults(searchResults);
        return this.model.findNewFavoritesOnReload();
      })
      .then((newFavoritesFound) => {
        this.processFavoritesFoundOnReload(newFavoritesFound);
        throw new PromiseChainExit();
      })
      .catch((emptyFavoritesDatabaseError) => {
        return this.findAllFavorites(emptyFavoritesDatabaseError);
      })
      .then(() => {
        this.onAllFavoritesFound();
        throw new PromiseChainExit();
      })
      .catch((chainExitError) => {
        this.broadcastAllFavoritesLoaded(chainExitError);
      });
  }

  /**
   * @param {Post[]} searchResults
   */
  showSearchResults(searchResults) {
    Utils.broadcastEvent("newSearchResults", searchResults);
    this.view.showSearchResults(searchResults);
  }

  /**
   * @param {Post[]} searchResults
   */
  processLoadedSearchResults(searchResults) {
    this.view.hideLoadingWheel();
    Utils.broadcastEvent("favoritesLoadedFromDatabase");
    this.showSearchResults(searchResults);
  }

  /**
   * @param {{newFavorites: Post[], newSearchResults: Post[]}} result
   */
  processFavoritesFoundOnReload(result) {
    this.view.insertNewSearchResultsOnReload(result);
    this.model.storeNewFavorites(result.newFavorites)
      .then(() => {
        if (result.newFavorites.length > 0) {
          this.view.showNotification("New favorites saved");
        }
      });
    Utils.broadcastEvent("newSearchResults", this.model.getLatestSearchResults());
  }

  /**
   * @param {EmptyFavoritesDatabase} error
   * @returns {Promise.<void>}
   */
  findAllFavorites(error) {
    if ((error instanceof EmptyFavoritesDatabase)) {
      this.view.hideLoadingWheel();
      this.changedPageOnce = true;
      Utils.broadcastEvent("startedFetchingFavorites");
      return this.model.fetchAllFavorites(this.onSearchResultsFound.bind(this));
    }
    throw error;
  }

  onAllFavoritesFound() {
    this.view.showNotification("Saving favorites");
    this.model.storeAllFavorites().then(() => {
      this.view.showNotification("All favorites saved");
    });
  }

  /**
   * @param {PromiseChainExit} error
   */
  broadcastAllFavoritesLoaded(error) {
    if (!(error instanceof PromiseChainExit)) {
      throw error;
    }
    Utils.broadcastEvent("favoritesLoaded");
  }

  onSearchResultsFound() {
    this.view.updateSearchResultsWhileFetching({
      searchResults: this.model.getLatestSearchResults(),
      allFavorites: this.model.getAllFavorites()
    });
    Utils.broadcastEvent("favoritesFetched");
    Utils.broadcastEvent("newSearchResults", this.model.getLatestSearchResults());
  }

  /**
   * @param {String} direction
   */
  didNotChangePageWhileInGallery(direction) {
    dispatchEvent(new CustomEvent("didNotChangePageInGallery", {
      detail: direction
    }));
  }

  /**
   * @param {String} searchQuery
   */
  searchFavorites(searchQuery) {
    this.showSearchResults(this.model.getSearchResults(searchQuery));
  }

  shuffleSearchResults() {
    this.showSearchResults(this.model.getShuffledSearchResults());
  }

  invertSearchResults() {
    this.showSearchResults(this.model.getInvertedSearchResults());
  }

  /**
   * @param {Boolean} value
   */
  toggleBlacklist(value) {
    this.model.toggleBlacklist(value);
    this.showSearchResults(this.model.getSearchResultsFromPreviousQuery());
  }

  /**
   * @param {"masonry" | "row" | "grid" } layout
   */
  changeLayout(layout) {
    this.view.changeLayout(layout);
  }

  onSortingParametersChanged() {
    this.showSearchResults(this.model.getSearchResultsFromPreviousQuery());
  }

  /**
   * @param {HTMLInputElement} input
   */
  updateResultsPerPage(input) {
    const resultsPerPage = parseInt(input.value);

    this.view.updateResultsPerPage(resultsPerPage);
    this.showSearchResults(this.model.getLatestSearchResults());
  }

  /**
   * @param {HTMLInputElement} input
   */
  updateColumnCount(input) {
    this.view.updateColumnCount(input);
  }

  /**
   * @param {HTMLInputElement} input
   */
  updateRowSize(input) {
    this.view.updateRowSize(input);
  }

  /**
   * @param {Number} allowedRatings
   */
  changeAllowedRatings(allowedRatings) {
    this.model.changeAllowedRatings(allowedRatings);
    this.showSearchResults(this.model.getSearchResultsFromPreviousQuery());
  }
}
