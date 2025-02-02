class FavoritesModel {
  /**
   * @type {EventEmitter}
   */
  network;
  /**
   * @type {FavoritesLoader}
   */
  loader;
  /**
   * @type {FavoritesFilter}
   */
  filter;
  /**
   * @type {Post[]}
   */
  latestSearchResults;

  /**
   * @param {EventEmitter} network
   */
  constructor(network) {
    this.network = network;
    this.loader = new FavoritesLoader(this.network);
    this.filter = new FavoritesFilter();
    this.latestSearchResults = [];
    this.network.on(Channels.favorites.controllerToModel, (/** @type {Message} */ message) => Utils.handleMessage(this, message));
    this.network.on(Channels.favorites.loaderToModel, (/** @type {Message} */ message) => Utils.handleMessage(this, message));
  }

  /**
   * @param {String} message
   */
  notify(message) {
    this.network.sendMessage(Channels.favorites.modelToController, "notify", message);
  }

  /**
   * @param {String} message
   */
  relay(message) {
    this.network.sendMessage(Channels.favorites.modelToController, message, {});
  }

  loadFavorites() {
    this.network.sendMessage(Channels.favorites.modelToLoader, "loadFavorites", {});
  }

  /**
   * @param {Post[]} favorites
   */
  onFavoritesFound(favorites) {
    this.latestSearchResults = this.latestSearchResults.concat(this.filter.filterFavorites(favorites));
    this.network.sendMessage(Channels.favorites.modelToController, "onNewSearchResultsFound", {
      searchResults: this.latestSearchResults,
      allFavorites: this.loader.getAllFavorites()
    });
  }

  /**
   * @param {Post[]} favorites
   */
  onFavoritesFoundOnReload(favorites) {
    const searchResults = this.filter.filterFavorites(favorites);

    this.latestSearchResults = searchResults.concat(this.latestSearchResults);
    this.network.sendMessage(Channels.favorites.modelToController, "onFavoritesFoundOnReload", {
      newFavoritesCount: favorites.length,
      newSearchResults: searchResults,
      allSearchResults: this.latestSearchResults
    });
  }

  onSortingParametersChanged() {
    this.sendSearchResults();
  }

  /**
   * @param {String} searchQuery
   */
  getSearchResults(searchQuery) {
    this.filter.setSearchCommand(searchQuery);
    this.sendSearchResults();
  }

  sendSearchResults() {
    this.latestSearchResults = this.filter.filterFavorites(this.loader.getAllFavorites());
    this.latestSearchResults = FavoritesSorter.sort(this.latestSearchResults);
    this.network.sendMessage(Channels.favorites.modelToController, "onSearchResultsReady", this.latestSearchResults);
  }

  /**
   * @param {Boolean} value
   */
  toggleBlacklist(value) {
    this.filter.toggleBlacklist(value);
    this.sendSearchResults();
  }

  /**
   * @param {Number} allowedRatings
   */
  changeAllowedRatings(allowedRatings) {
    this.filter.allowedRatings = allowedRatings;
    this.sendSearchResults();
  }

  updateResultsPerPage() {
    setTimeout(() => {
      this.network.sendMessage(Channels.favorites.modelToController, "onSearchResultsReady", this.latestSearchResults);
    }, 0);
  }

  shuffleSearchResults() {
    this.network.sendMessage(Channels.favorites.modelToController, "onSearchResultsReady", Utils.shuffleArray(this.latestSearchResults));
  }

  invertSearchResults() {
    for (const favorite of this.loader.allFavorites) {
      favorite.toggleMatchedByMostRecentSearch();
    }
    const invertedSearchResults = this.loader.allFavorites.filter(favorite => favorite.matchedByLatestSearch);

    this.network.sendMessage(Channels.favorites.modelToController, "onSearchResultsReady", invertedSearchResults);
  }

  /**
   * @param {String} direction
   */
  getSearchResultsForPageChangeInGallery(direction) {
    this.network.sendMessage(
      Channels.favorites.modelToController, "onGalleryPageChangeSearchResultsReady",
      {
        direction,
        searchResults: this.latestSearchResults
      }
    );
  }

  /**
   * @param {String} id
   */
  updateMetadata(id) {
    this.network.sendMessage(Channels.favorites.modelToLoader, "updateMetadataInDatabase", id);
  }
}
