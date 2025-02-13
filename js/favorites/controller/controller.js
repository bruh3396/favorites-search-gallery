class FavoritesController {
  static get disabled() {
    return !Utils.onFavoritesPage();
  }
  /**
   * @type {FavoritesModel}
   */
  model;
  /**
   * @type {FavoritesView}
   */
  view;

  constructor() {
    if (FavoritesController.disabled) {
      return;
    }
    this.model = new FavoritesModel();
    this.view = new FavoritesView({
      onPageChange: this.onPageChange.bind(this)
    });
    this.addEventListeners();
    this.view.clearOriginalFavorites();
    this.broadcastConfiguration();
    this.loadAllFavorites();
  }

  onPageChange() {
    Utils.broadcastEvent("changedPage");
    GlobalEvents.favorites.emit("changedPage");
  }

  addEventListeners() {
    this.addEventListenersToMenu();
    this.addGlobalEventListeners();
  }

  addEventListenersToMenu() {
    const menu = document.getElementById("favorites-search-gallery-menu");

    if (menu === null) {
      return;
    }
    // @ts-ignore
    menu.addEventListener("controller", (/** @type {CustomEvent} */ event) => {
      if (!(event.target instanceof HTMLElement)) {
        return;
      }
      const action = event.target.dataset.action || "none";

      if (typeof this[action] === "function") {
        this[action](event.detail);
      }
    });
  }

  addGlobalEventListeners() {
    // @ts-ignore
    window.addEventListener("reachedEndOfGallery", (/** @type {CustomEvent} */event) => {
      const direction = event.detail;
      const pageWasChanged = this.view.changePageInGallery({
        direction,
        searchResults: this.model.getLatestSearchResults()
      });

      if (!pageWasChanged) {
        dispatchEvent(new CustomEvent("didNotChangePageInGallery", {
          detail: direction
        }));
      }
    });
    // @ts-ignore
    window.addEventListener("missingMetadata", (/** @type CustomEvent */ event) => {
      this.model.updateMetadata(event.detail);
    });
  }

  broadcastConfiguration() {
    window.addEventListener("postProcess", () => {
      GlobalEvents.favorites.emit("layoutChanged", Utils.getPreference("layoutSelect", "masonry"));
    });
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
   * @param {{newFavorites: Post[], newSearchResults: Post[], allSearchResults: Post[]}} results
   */
  processFavoritesFoundOnReload(results) {
    this.view.insertNewSearchResultsOnReload(results);
    this.model.storeNewFavorites(results.newFavorites)
      .then(() => {
        if (results.newFavorites.length > 0) {
          this.view.showNotification("New favorites saved");
        }
      });
    Utils.broadcastEvent("newSearchResults", results.allSearchResults);
  }

  /**
   * @param {EmptyFavoritesDatabase} error
   * @returns {Promise.<void>}
   */
  findAllFavorites(error) {
    if ((error instanceof EmptyFavoritesDatabase)) {
      this.view.hideLoadingWheel();
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
    // Utils.broadcastEvent("favoritesLoaded");
    GlobalEvents.favorites.emit("favoritesLoaded");
  }

  onSearchResultsFound() {
    const addedSearchResults = this.view.updateSearchResultsWhileFetching({
      searchResults: this.model.getLatestSearchResults(),
      allFavorites: this.model.getAllFavorites()
    });

    GlobalEvents.favorites.emit("resultsAddedToCurrentPage", addedSearchResults);
    Utils.broadcastEvent("favoritesFetched");
    Utils.broadcastEvent("newSearchResults", this.model.getLatestSearchResults());
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
   * @param {"masonry" | "row" | "square" | "grid" } layout
   */
  changeLayout(layout) {
    GlobalEvents.favorites.emit("layoutChanged", layout);
    this.view.changeLayout(layout);
  }

  /**
   * @param {String} sortingMethod
   */
  updateSortingMethod(sortingMethod) {
    this.model.updateSortingMethod(sortingMethod);
    this.showSearchResults(this.model.getSearchResultsFromPreviousQuery());
  }

  /**
   * @param {Boolean} value
   */
  toggleSortAscending(value) {
    this.model.toggleSortAscending(value);
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
