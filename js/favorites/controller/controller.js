class FavoritesController {
  /** @type {FavoritesModel} */
  model;
  /** @type {FavoritesView} */
  view;
  /** @type {FavoritesPaginationController} */
  paginationController;
  /** @type {FavoritesInfiniteScrollController} */
  infiniteScrollController;

  /** @type {FavoritesSecondaryController} */
  get secondaryController() {
    return this.model.infiniteScroll ? this.infiniteScrollController : this.paginationController;
  }

  /** @type {FavoritesSecondaryController[]} */
  get secondaryControllers() {
    return [this.infiniteScrollController, this.paginationController];
  }

  constructor() {
    if (!Flags.onFavoritesPage) {
      return;
    }
    this.model = new FavoritesModel();
    this.view = new FavoritesView();
    this.paginationController = new FavoritesPaginationController(this.model, this.view);
    this.infiniteScrollController = new FavoritesInfiniteScrollController(this.model, this.view);
    this.addEventListeners();
    this.loadAllFavorites();
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
    this.addButtonEventListenersToMainMenu();
    this.addCheckboxEventListenersToMainMenu();
    this.addNumericEventListenersToMainMenu();
    this.addOtherEventListenersToMainMenu();
  }

  addOtherEventListenersToMainMenu() {
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
  }

  addNumericEventListenersToMainMenu() {
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
  }

  addCheckboxEventListenersToMainMenu() {
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
  }

  addButtonEventListenersToMainMenu() {
    Events.favorites.shuffleButtonClicked.on(() => {
      this.showSearchResults(this.model.getShuffledSearchResults());
    });
    Events.favorites.downloadButtonClicked.on(() => {
      this.model.downloadSearchResults();
    });
    Events.favorites.invertButtonClicked.on(() => {
      this.model.invertSearchResults();
      this.showSearchResults(this.model.getLatestSearchResults());
    });
  }

  addEventListenersToPaginationMenu() {
    // @ts-ignore
    this.view.getPaginationMenu().addEventListener("controller", (/** @type {CustomEvent} */event) => {
      this.secondaryController.handlePaginationMenuEvent(event);
    });
  }

  addGlobalEventListeners() {
    this.setupPageChangingInGallery();
    this.updateMissingMetadataWhenAvailable();
    this.updateLayoutWhenOptionsChange();
  }

  setupPageChangingInGallery() {
    Events.gallery.requestPageChange.on((direction) => {
      this.secondaryController.handlePageChangeRequest(direction);
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

      if (columnInput instanceof HTMLInputElement) {
        this.view.updateColumnCount(parseFloat(columnInput.value));
      }

      if (rowInput instanceof HTMLInputElement) {
        this.view.updateRowSize(parseFloat(rowInput.value));
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
          this.secondaryController.gotoAdjacentPage(direction);
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
        throw new PromiseChainExitError();
      })
      .catch((emptyFavoritesDatabaseError) => {
        return this.findAllFavorites(emptyFavoritesDatabaseError);
      })
      .then(() => {
        this.onAllFavoritesFound();
        throw new PromiseChainExitError();
      })
      .catch((chainExitError) => {
        this.broadcastAllFavoritesLoaded(chainExitError);
      });
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
   * @param {EmptyFavoritesDatabaseError} error
   * @returns {Promise<void>}
   */
  findAllFavorites(error) {
    if ((error instanceof EmptyFavoritesDatabaseError)) {
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
   * @param {PromiseChainExitError} error
   */
  broadcastAllFavoritesLoaded(error) {
    if (!(error instanceof PromiseChainExitError)) {
      throw error;
    }
    Events.favorites.favoritesLoaded.emit();
  }

  onSearchResultsFound() {
    this.view.updateStatusWhileFetching(this.model.getLatestSearchResults().length, this.model.getAllFavorites().length);
    Events.favorites.newSearchResults.emit(this.model.getLatestSearchResults());
    this.secondaryController.handleNewSearchResultsFound();
  }

  onSearchResultsFoundUsingPagination() {
    this.model.paginate(this.model.getLatestSearchResults());
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

  /**
   * @param {Post[]} searchResults
   */
  showSearchResults(searchResults) {
    Events.favorites.newSearchResults.emit(searchResults);
    this.view.setMatchCount(searchResults.length);
    this.secondaryController.showSearchResults(searchResults);
  }

  /**
   * @param {String} id
   */
  findFavorite(id) {
    this.secondaryController.findFavorite(id);
  }

  /**
   * @param {Boolean} value
   */
  toggleInfiniteScroll(value) {
    this.resetSecondaryControllers();
    this.model.toggleInfiniteScroll(value);
    this.view.togglePaginationMenu(!value);

    if (value) {
      Events.favorites.pageChange.emit();
    }
    this.showSearchResults(this.model.getLatestSearchResults());
  }

  resetSecondaryControllers() {
    for (const controller of this.secondaryControllers) {
      controller.reset();
    }
  }
}
