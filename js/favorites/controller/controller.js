class FavoritesController {
  /** @type {FavoritesModel} */
  model;
  /** @type {FavoritesView} */
  view;
  /** @type {FavoritesMenuEventListener} */
  menuListener;
  /** @type {FavoritesPaginationController} */
  paginationController;
  /** @type {FavoritesInfiniteScrollController} */
  infiniteScrollController;

  /** @type {FavoritesDisplayController} */
  get displayController() {
    return this.model.infiniteScroll ? this.infiniteScrollController : this.paginationController;
  }

  /** @type {FavoritesDisplayController[]} */
  get secondaryControllers() {
    return [this.infiniteScrollController, this.paginationController];
  }

  constructor() {
    if (!Flags.onFavoritesPage) {
      return;
    }
    this.model = new FavoritesModel();
    this.view = new FavoritesView();
    this.menuListener = new FavoritesMenuEventListener(this);
    this.paginationController = new FavoritesPaginationController(this.model, this.view);
    this.infiniteScrollController = new FavoritesInfiniteScrollController(this.model, this.view);
    this.addEventListeners();
    this.loadAllFavorites();
  }

  addEventListeners() {
    this.addEventListenersToPaginationMenu();
    this.addGlobalEventListeners();
    this.addKeyDownEventListeners();
  }

  addEventListenersToPaginationMenu() {
    // @ts-ignore
    this.view.getPaginationMenu().addEventListener("controller", (/** @type {CustomEvent} */event) => {
      this.displayController.handlePaginationMenuEvent(event);
    });
  }

  addGlobalEventListeners() {
    this.setupPageChangingInGallery();
    this.updateMissingMetadataWhenAvailable();
    this.updateLayoutWhenOptionsChange();
    this.updateDatabaseWhenFavoriteRemoved();
  }

  setupPageChangingInGallery() {
    Events.gallery.requestPageChange.on((direction) => {
      this.displayController.handlePageChangeRequest(direction);
    });
  }

  updateMissingMetadataWhenAvailable() {
    Events.favorites.foundMissingMetadata.on((id) => {
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
          this.displayController.gotoAdjacentPage(direction);
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
    this.displayController.handleNewSearchResultsFound();
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
