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
      onPageChange: this.onPageChange.bind(this),
      onLayoutCompleted: () => {
        GlobalEvents.favorites.emit("layoutCompleted");
      }
    });
    this.addEventListeners();
    this.view.clearOriginalFavorites();
    this.loadAllFavorites();
  }

  onPageChange() {
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
    GlobalEvents.gallery.on("requestPageChange", (/** @type {String} */ direction) => {
      this.view.changePageInGallery({
        direction,
        searchResults: this.model.getLatestSearchResults()
      });
      GlobalEvents.favorites.emit("pageChangeResponse");
    });
    // @ts-ignore
    window.addEventListener("missingMetadata", (/** @type CustomEvent */ event) => {
      this.model.updateMetadata(event.detail);
    });
  }

  loadAllFavorites() {
    this.model.loadAllFavorites()
      .then((searchResults) => {
        this.processLoadedSearchResults(searchResults);
        GlobalEvents.favorites.emit("favoritesLoadedFromDatabase");
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
    GlobalEvents.favorites.emit("newSearchResults", searchResults);
    this.view.showSearchResults(searchResults);
  }

  /**
   * @param {Post[]} searchResults
   */
  processLoadedSearchResults(searchResults) {
    this.view.hideLoadingWheel();
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
    GlobalEvents.favorites.emit("newFavoritesFoundOnReload", results.newSearchResults);
    GlobalEvents.favorites.emit("newSearchResults", results.allSearchResults);
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
    GlobalEvents.favorites.emit("favoritesLoaded");
  }

  onSearchResultsFound() {
    const addedSearchResults = this.view.updateSearchResultsWhileFetching({
      searchResults: this.model.getLatestSearchResults(),
      allFavorites: this.model.getAllFavorites()
    });

    if (addedSearchResults.length > 0) {
      GlobalEvents.favorites.emit("resultsAddedToCurrentPage", addedSearchResults);
    }
    Utils.broadcastEvent("favoritesFetched");
    GlobalEvents.favorites.emit("newSearchResults", this.model.getLatestSearchResults());
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

    GlobalEvents.favorites.emit("resultsPerPageChanged", resultsPerPage);
    this.view.updateResultsPerPage(resultsPerPage);
    this.showSearchResults(this.model.getLatestSearchResults());
  }

  /**
   * @param {HTMLInputElement} input
   */
  updateColumnCount(input) {
    GlobalEvents.favorites.emit("favoritesResized");
    this.view.updateColumnCount(input);
  }

  /**
   * @param {HTMLInputElement} input
   */
 updateRowSize(input) {
    GlobalEvents.favorites.emit("favoritesResized");
    this.view.updateRowSize(input);
  }

  /**
   * @param {Number} allowedRatings
   */
  changeAllowedRatings(allowedRatings) {
    this.model.changeAllowedRatings(allowedRatings);
    this.showSearchResults(this.model.getSearchResultsFromPreviousQuery());
  }

  /**
   * @param {String} id
   */
  findFavorite(id) {
    this.view.findFavorite(id, this.model.getLatestSearchResults());
  }
}
