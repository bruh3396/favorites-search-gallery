class FavoritesController {
  /** @type {FavoritesModel} */
  model;
  /** @type {FavoritesView} */
  view;
  /** @type {FavoritesMenu} */
  menu;
  /** @type {FavoritesPaginationController} */
  paginationController;
  /** @type {FavoritesInfiniteScrollController} */
  infiniteScrollController;

  /** @type {FavoritesDisplayController} */
  get displayController() {
    return this.model.infiniteScroll ? this.infiniteScrollController : this.paginationController;
  }

  /** @type {FavoritesDisplayController[]} */
  get displayControllers() {
    return [this.infiniteScrollController, this.paginationController];
  }

  constructor() {
    if (!Flags.onFavoritesPage) {
      return;
    }
    this.model = new FavoritesModel();
    this.view = new FavoritesView();
    this.menu = new FavoritesMenu();
    new FavoritesDownloadMenu();
    this.paginationController = new FavoritesPaginationController(this.model, this.view);
    this.infiniteScrollController = new FavoritesInfiniteScrollController(this.model, this.view);
    this.addEventListeners();
    this.loadAllFavorites();
  }

  addEventListeners() {
    this.addEventListenersToMainMenu();
    this.addGlobalEventListeners();
    this.addKeyDownEventListeners();
  }

  addEventListenersToMainMenu() { }
  addButtonEventListenersToMainMenu() { }
  addCheckboxEventListenersToMainMenu() { }
  addNumericEventListenersToMainMenu() { }
  addOtherEventListenersToMainMenu() { }

  addGlobalEventListeners() {
    this.setupPageChangingInGallery();
    this.updateMissingMetadataWhenAvailable();
    this.updateLayoutWhenOptionsChange();
    this.updateDatabaseWhenFavoriteRemoved();
    this.deleteDatabaseOnReset();
  }

  setupPageChangingInGallery() {
    Events.gallery.requestPageChange.on((direction) => {
      this.displayController.handlePageChangeRequest(direction);
    });
  }

  updateMissingMetadataWhenAvailable() {
    Events.favorites.missingMetadataFound.on((id) => {
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

  updateDatabaseWhenFavoriteRemoved() {
    Events.favorites.favoriteRemoved.on(async(id) => {
      await this.model.deleteFavorite(id);
    });
  }

  deleteDatabaseOnReset() {
    Events.favorites.reset.on(() => {
      this.model.deleteDatabase();
    });
  }

  addKeyDownEventListeners() {
    Events.global.keydown.on(async(event) => {
      if (!event.isHotkey) {
        return;
      }

      if (event.originalEvent.key !== "ArrowRight" && event.originalEvent.key !== "ArrowLeft") {
        return;
      }
      const inGallery = await Utils.inGallery();

      if (inGallery) {
        return;
      }
      this.displayController.gotoAdjacentPageDebounced(event.originalEvent.key);
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
      .catch((error) => {
        if (!(error instanceof PromiseChainExitError)) {
          throw error;
        }
        Events.favorites.favoritesLoaded.emit();
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
    Events.favorites.searchResultsUpdated.emit(results.allSearchResults);
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
    this.model.storeAllFavorites()
      .then(() => {
        this.view.showNotification("All favorites saved");
      });
  }

  onSearchResultsFound() {
    this.view.updateStatusWhileFetching(this.model.getLatestSearchResults().length, this.model.getAllFavorites().length);
    Events.favorites.searchResultsUpdated.emit(this.model.getLatestSearchResults());
    this.displayController.handleNewSearchResultsFound();
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
    Events.favorites.searchResultsUpdated.emit(searchResults);
    this.view.setMatchCount(searchResults.length);
    this.displayController.showSearchResults(searchResults);
  }

  /**
   * @param {String} id
   */
  findFavorite(id) {
    this.displayController.findFavorite(id);
  }

  /**
   * @param {Boolean} value
   */
  toggleInfiniteScroll(value) {
    this.resetDisplayControllers();
    this.model.toggleInfiniteScroll(value);
    this.view.togglePaginationMenu(!value);

    if (value) {
      Events.favorites.pageChanged.emit();
    }
    this.showSearchResults(this.model.getLatestSearchResults());
  }

  resetDisplayControllers() {
    for (const controller of this.displayControllers) {
      controller.reset();
    }
  }
}
