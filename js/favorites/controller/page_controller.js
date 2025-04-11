class FavoritesPaginationController extends FavoritesDisplayController {
  /** @type {Function} */
  debouncedShowCurrentPage;

  /**
   * @param {FavoritesModel} model
   * @param {FavoritesView} view
   */
  constructor(model, view) {
    super(model, view);
    this.model = model;
    this.view = view;
    this.debouncedShowCurrentPage = Utils.debounceAfterFirstCall(this.showCurrentPageWithoutMenu.bind(this), 500);
    this.addEventListeners();
  }

  addEventListeners() {
    Events.favorites.pageSelected.on((pageNumber) => {
      this.model.changePage(pageNumber);
      this.showCurrentPage();
    });
    Events.favorites.relativePageSelected.on((relativePage) => {
      if (this.model.gotoRelativePage(relativePage)) {
        this.showCurrentPage();
      }
    });
  }

  handleNewSearchResultsFound() {
    this.model.paginate(this.model.getLatestSearchResults());
    this.view.createPageSelectionMenuWhileFetching(this.model.getPaginationParameters());
    this.addNewlyFetchedSearchResultsToCurrentPage();
    Events.favorites.searchResultsUpdated.emit(this.model.getLatestSearchResults());
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
   * @param {Post[]} searchResults
   */
  showSearchResults(searchResults) {
    this.model.paginate(searchResults);
    this.model.changePage(1);
    this.showCurrentPage();
  }

  showCurrentPage() {
    this.view.showSearchResults(this.model.getFavoritesOnCurrentPage());
    this.view.createPageSelectionMenu(this.model.getPaginationParameters());
    Events.favorites.pageChanged.emit();
  }

  showCurrentPageWithoutMenu() {
    this.view.showSearchResults(this.model.getFavoritesOnCurrentPage());
    Events.favorites.pageChanged.emit();
  }

  /**
   * @param {String} id
   */
  findFavorite(id) {
    if (this.model.gotoPageWithFavoriteId(id)) {
      this.showCurrentPage();
    }
    this.view.revealFavorite(id);
  }

  /**
   * @param {NavigationKey} direction
   */
  handlePageChangeRequest(direction) {
    this.gotoAdjacentPage(direction);
    Events.favorites.pageChangeResponse.emit();
  }

  /**
   * @param {NavigationKey} direction
   */
  gotoAdjacentPage(direction) {
    if (this.model.gotoAdjacentPage(direction)) {
      this.showCurrentPage();
    }
  }

  /**
   * @param {NavigationKey} direction
   */
  gotoAdjacentPageDebounced(direction) {
    if (this.model.gotoAdjacentPage(direction)) {
      this.view.createPageSelectionMenu(this.model.getPaginationParameters());
      this.debouncedShowCurrentPage();
    }
  }
}
