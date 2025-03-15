class FavoritesController {
  static get disabled() {
    return !Flags.onFavoritesPage;
  }
  /** @type {FavoritesModel} */
  model;
  /** @type {FavoritesView} */
  view;
  /** @type {FavoritesPageBottomObserver} */
  pageBottomObserver;

  constructor() {
    if (FavoritesController.disabled) {
      return;
    }
    this.model = new FavoritesModel();
    this.view = new FavoritesView();
    this.pageBottomObserver = new FavoritesPageBottomObserver(this.onPageBottomReached.bind(this));
    this.addEventListeners();
    this.loadAllFavorites();
  }

  onPageBottomReached() {
    if (!this.model.infiniteScroll) {
      return;
    }
    this.showInfiniteScrollSearchResults();
  }

  addEventListeners() {
    this.addEventListenersToMainMenu();
    this.addEventListenersToPaginationMenu();
    this.addGlobalEventListeners();
    this.addKeyDownEventListeners();
  }

  addEventListenersToMainMenu() {
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

      // @ts-ignore
      if (typeof this[action] === "function") {
        // @ts-ignore
        this[action](event.detail);
      }
    });
  }

  addEventListenersToPaginationMenu() {
    // @ts-ignore
    this.view.getPaginationMenu().addEventListener("controller", (/** @type {CustomEvent} */event) => {
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
    });
  }

  addGlobalEventListeners() {
    this.setupPageChangingInGallery();
    this.updateMissingMetadataWhenAvailable();
    this.updateLayoutWhenOptionsChange();
  }

  setupPageChangingInGallery() {
    Events.gallery.requestPageChange.on((direction) => {
      this.gotoAdjacentPage(direction);
      Events.favorites.pageChangeResponse.emit();
    });
  }

  updateMissingMetadataWhenAvailable() {
    Events.favorites.missingMetadata.on((id) => {
      this.model.updateMetadata(id);
    });
  }

  updateLayoutWhenOptionsChange() {
    window.addEventListener("resize", Utils.debounceAfterFirstCall(() => {
      const columnInput = document.getElementById("column-count");
      const rowInput = document.getElementById("row-size");

      if (columnInput !== null && (columnInput instanceof HTMLInputElement)) {
        this.updateColumnCount(columnInput);
      }

      if (rowInput !== null && (rowInput instanceof HTMLInputElement)) {
        this.updateRowSize(rowInput);
      }
    }, 100));
  }

  addKeyDownEventListeners() {
    Events.global.keydown.on((event) => {
      if ((event.originalEvent.key === "ArrowRight" || event.originalEvent.key === "ArrowLeft") && !event.originalEvent.repeat) {
        this.changePageWithArrowKey(event.originalEvent.key);
      }
    });
  }

  /**
   * @param {NavigationKey} direction
   */
  changePageWithArrowKey(direction) {
    if (Types.isTypeableInput(document.activeElement)) {
      return;
    }
    Utils.inGallery()
      .then((inGallery) => {
        if (!inGallery) {
          this.gotoAdjacentPage(direction);
        }
      });
  }

  loadAllFavorites() {
    this.model.loadAllFavorites()
      .then((searchResults) => {
        this.processLoadedSearchResults(searchResults);
        Events.favorites.favoritesLoadedFromDatabase.emit();
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
    Events.favorites.newSearchResults.emit(searchResults);
    this.view.setMatchCount(searchResults.length);

    if (this.model.infiniteScroll) {
      this.view.clear();
      this.showInfiniteScrollSearchResults();
      return;
    }
    this.showPaginatedSearchResults(searchResults);
  }

  showInfiniteScrollSearchResults() {
    const thumbs = Utils.getThumbsFromPosts(this.model.getNextWaterfallBatch());

    if (thumbs.length === 0) {
      return;
    }
    this.view.insertNewSearchResults(thumbs);
    Events.favorites.resultsAddedToCurrentPage.emit(thumbs);

    Utils.waitForAllThumbnailsToLoad()
      .then(() => {
        this.pageBottomObserver.observeBottomElements();
      });
  }

  /**
   * @param {Post[]} searchResults
   */
  showPaginatedSearchResults(searchResults) {
    this.model.paginate(searchResults);
    this.model.changePage(1);
    this.showCurrentPage();
  }

  showCurrentPage() {
    if (this.model.infiniteScroll) {
      return;
    }
    this.view.showSearchResults(this.model.getFavoritesOnCurrentPage());
    this.view.createPageSelectionMenu(this.model.getPaginationParameters());
    this.broadcastPageChange();
  }

  /**
   * @param {NavigationKey} direction
   */
  gotoAdjacentPage(direction) {
    if (this.model.gotoAdjacentPage(direction)) {
      this.showCurrentPage();
    }
  }

  broadcastPageChange() {
    Events.favorites.pageChange.emit();
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
    this.model.paginate(this.model.getLatestSearchResults());
    Events.favorites.newFavoritesFoundOnReload.emit(results.newSearchResults);
    Events.favorites.newSearchResults.emit(results.allSearchResults);
  }

  /**
   * @param {EmptyFavoritesDatabase} error
   * @returns {Promise<void>}
   */
  findAllFavorites(error) {
    if ((error instanceof EmptyFavoritesDatabase)) {
      this.view.hideLoadingWheel();
      Events.favorites.startedFetchingFavorites.emit();
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
    Events.favorites.favoritesLoaded.emit();
    this.pageBottomObserver.observeBottomElements();
  }

  onSearchResultsFound() {
    this.model.paginate(this.model.getLatestSearchResults());
    this.view.updateStatusWhileFetching(this.model.getLatestSearchResults().length, this.model.getAllFavorites().length);
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
   * @param {String} layout
   */
  changeLayout(layout) {
    if (!Types.isFavoritesLayout(layout)) {
      return;
    }
    Events.favorites.layoutChanged.emit(layout);
    this.view.changeLayout(layout);

    if (this.model.infiniteScroll) {
      this.pageBottomObserver.disconnect();
      this.pageBottomObserver.observeBottomElements();
    }
  }

  /**
   * @param {String} sortingMethod
   */
  setSortingMethod(sortingMethod) {
    if (Types.isMetadataMetric(sortingMethod)) {
      this.model.setSortingMethod(sortingMethod);
      this.showSearchResults(this.model.getSearchResultsFromPreviousQuery());
    }
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
    this.model.updateResultsPerPage(parseInt(input.value));
    this.showSearchResults(this.model.getLatestSearchResults());
  }

  /**
   * @param {HTMLInputElement} input
   */
  updateColumnCount(input) {
    Events.favorites.favoritesResized.emit();
    this.view.updateColumnCount(input);
  }

  /**
   * @param {HTMLInputElement} input
   */
  updateRowSize(input) {
    Events.favorites.favoritesResized.emit();
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
    if (this.model.gotoPageWithFavorite(id)) {
      this.showCurrentPage();
    }
    this.view.revealFavorite(id);
  }

  downloadSearchResults() {
    this.model.downloadSearchResults();
  }

  /**
   * @param {Boolean} value
   */
  toggleInfiniteScroll(value) {
    this.model.toggleInfiniteScroll(value);
    this.view.togglePaginationMenu(!value);
    this.showSearchResults(this.model.getLatestSearchResults());
  }
}
