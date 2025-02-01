class FavoritesController {
  static get disabled() {
    return !Utils.onFavoritesPage();
  }
  /**
   * @type {EventEmitter}
   */
  network;
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
    this.network = new EventEmitter();
    this.model = new FavoritesModel(this.network);
    this.view = new FavoritesView(this.network);
    this.setupNetwork();
    this.routeMenuEventsThroughNetwork();
    this.routeGlobalEventsThroughNetwork();
    this.start();
  }

  setupNetwork() {
    this.network.on(Channels.favorites.modelToController, (/** @type {Message} */ message) => Utils.handleMessage(this, message));
    this.network.on(Channels.favorites.viewToController, (/** @type {Message} */ message) => Utils.handleMessage(this, message));
  }

  routeMenuEventsThroughNetwork() {
    const menu = document.getElementById("favorites-search-gallery-menu");

    if (menu === null) {
      return;
    }
    menu.addEventListener("controller", (event) => {
        this.routeMenuEventThroughNetwork(event);
    });
  }

  /**
   * @param {CustomEvent} event
   */
  routeMenuEventThroughNetwork(event) {
    for (const channel of [Channels.favorites.controllerToView, Channels.favorites.controllerToModel]) {
      this.network.sendMessage(channel, event.target.dataset.action, event.detail);
    }
  }

  routeGlobalEventsThroughNetwork() {
    // window.addEventListener("modifiedTags", () => {
    //   this.searchFlags.tagsWereModified = true;
    // });
    window.addEventListener("reachedEndOfGallery", (event) => {
      this.network.sendMessage(Channels.favorites.controllerToView, "changePageInGallery", /** @type {CustomEvent} */ (event).detail);
    });
    // window.addEventListener("missingMetadata", (event) => {
    //   this.database.updateMetadataInDatabase(event.detail);
    // });
  }

  start() {
    this.network.sendMessage(Channels.favorites.controllerToView, "clearOriginalFavoritesContent", {});
    this.network.sendMessage(Channels.favorites.controllerToModel, "loadFavorites", {});
  }

  onFinishedAccessingDatabase() {
    this.network.sendMessage(Channels.favorites.controllerToView, "hideLoadingWheel", {});
  }

  /**
   * @param {String} message
   */
  notify(message) {
    this.network.sendMessage(Channels.favorites.controllerToView, "showNotification", message);
  }

  onStartedFetchingFavorites() {
    Utils.broadcastEvent("startedFetchingFavorites");
  }

  /**
   * @param {{searchResults: Post[], allFavorites: Post[]}} param
   */
  onNewSearchResultsFound({searchResults, allFavorites}) {
    this.network.sendMessage(Channels.favorites.controllerToView, "updateSearchResultsWhileFetching", {
      searchResults,
      allFavorites
    });
    Utils.broadcastEvent("favoritesFetched");
    Utils.broadcastEvent("newSearchResults", searchResults);
  }

  /**
   * @param {Post[]} searchResults
   */
  onSearchResultsReady(searchResults) {
    this.network.sendMessage(Channels.favorites.controllerToView, "showSearchResults", searchResults);
    Utils.broadcastEvent("newSearchResults", searchResults);
  }

  onAllFavoritesFound() {
    this.notify("Saving Favorites");
    Utils.broadcastEvent("favoritesLoaded");
  }

  onFavoritesLoaded() {
    this.notify("All favorites loaded");
    this.network.sendMessage(Channels.favorites.controllerToModel, "getSearchResults", "");
    Utils.broadcastEvent("favoritesLoadedFromDatabase");
    Utils.broadcastEvent("favoritesLoaded");
  }

  /**
   * @param {{newFavoritesCount: Number, newSearchResults: Post[], allSearchResults: Post[]}}
   */
  onFavoritesFoundOnReload({newSearchResults, newFavoritesCount, allSearchResults}) {
    this.network.sendMessage(Channels.favorites.controllerToView, "insertNewSearchResultsOnReload", {
      newSearchResults,
      newFavoritesCount
    });
    Utils.broadcastEvent("newFavoritesFoundOnReload", newSearchResults.map(post => post.root));
    Utils.broadcastEvent("newSearchResults", allSearchResults);
  }

  onPageChanged() {
    Utils.broadcastEvent("changedPage");
  }
}
