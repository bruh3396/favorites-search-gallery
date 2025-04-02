class FavoritesMenuController {
  /** @type {FavoritesController} */
  controller;

  /**
   * @param {FavoritesController} controller
   */
  constructor(controller) {
    this.controller = controller;
    this.addEventListenersToMainMenu();
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
      if (typeof this.controller[action] === "function") {
        // @ts-ignore
        this.controller[action](event.detail);
      }
    });
    this.addButtonEventListenersToMainMenu();
    this.addCheckboxEventListenersToMainMenu();
    this.addNumericEventListenersToMainMenu();
    this.addOtherEventListenersToMainMenu();
  }

  addOtherEventListenersToMainMenu() {
    Events.favorites.sortingMethodChanged.on((sortingMethod) => {
      this.controller.model.setSortingMethod(sortingMethod);
      this.controller.showSearchResults(this.controller.model.getSearchResultsFromPreviousQuery());
    });
    Events.favorites.layoutChanged.on((layout) => {
      this.controller.view.changeLayout(layout);
    });
    Events.favorites.performanceProfileChanged.on(() => {
      window.location.reload();
    });
    Events.favorites.allowedRatingsChanged.on((allowedRatings) => {
      this.controller.model.changeAllowedRatings(allowedRatings);
      this.controller.showSearchResults(this.controller.model.getSearchResultsFromPreviousQuery());
    });
    Events.favorites.searchSubset.on(() => {
      this.controller.model.setSearchSubset();
    });
    Events.favorites.stopSearchSubset.on(() => {
      this.controller.model.stopSearchSubset();
    });
  }

  addNumericEventListenersToMainMenu() {
    Events.favorites.columnCountChanged.on((columnCount) => {
      this.controller.view.updateColumnCount(columnCount);
      Events.favorites.favoritesResized.emit();
    });
    Events.favorites.rowSizeChanged.on((rowSize) => {
      this.controller.view.updateRowSize(rowSize);
      Events.favorites.favoritesResized.emit();
    });
    Events.favorites.resultsPerPageChanged.on((resultsPerPage) => {
      this.controller.model.changeResultsPerPage(resultsPerPage);
      this.controller.showSearchResults(this.controller.model.getSearchResultsFromPreviousQuery());
    });
  }

  addCheckboxEventListenersToMainMenu() {
    Events.favorites.sortAscendingToggled.on((value) => {
      this.controller.model.toggleSortAscending(value);
      this.controller.showSearchResults(this.controller.model.getSearchResultsFromPreviousQuery());
    });
    Events.favorites.blacklistToggled.on((value) => {
      this.controller.model.toggleBlacklist(value);
      this.controller.showSearchResults(this.controller.model.getSearchResultsFromPreviousQuery());
    });
    Events.favorites.infiniteScrollToggled.on((value) => {
      this.controller.toggleInfiniteScroll(value);
    });
  }

  addButtonEventListenersToMainMenu() {
    Events.favorites.shuffleButtonClicked.on(() => {
      this.controller.showSearchResults(this.controller.model.getShuffledSearchResults());
    });
    Events.favorites.downloadButtonClicked.on(() => {
      this.controller.model.downloadSearchResults();
    });
    Events.favorites.invertButtonClicked.on(() => {
      this.controller.model.invertSearchResults();
      this.controller.showSearchResults(this.controller.model.getLatestSearchResults());
    });
  }

}
