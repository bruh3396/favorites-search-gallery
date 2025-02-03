class FavoritesModel {
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

  constructor() {
    this.loader = new FavoritesLoader();
    this.filter = new FavoritesFilter();
    this.latestSearchResults = [];
  }

  /**
   * @returns {Promise.<Post[]>}
   */
  loadAllFavorites() {
    return this.loader.loadAllFavorites()
      .then(() => {
        return this.getSearchResults("");
      });
  }

  /**
   * @param {Function} onSearchResultsFound
   * @returns {Promise.<void>}
   */
  fetchAllFavorites(onSearchResultsFound) {
    const onFavoritesFound = (/** @type {Post[]} */ favorites) => {
      this.latestSearchResults = this.latestSearchResults.concat(this.filter.filterFavorites(favorites));
      return onSearchResultsFound();
    };
    return this.loader.fetchAllFavorites(onFavoritesFound);
  }

  /**
   * @returns {Promise.<{newFavorites: Post[], newSearchResults: Post[]}>}
   */
  findNewFavoritesOnReload() {
    return this.loader.fetchFavoritesOnReload()
      .then((newFavorites) => {
        const newSearchResults = this.filter.filterFavorites(newFavorites);

        this.latestSearchResults = newSearchResults.concat(this.latestSearchResults);
        return {
          newFavorites,
          newSearchResults
        };
      });
  }

  /**
   * @param {Post[]} newFavorites
   * @returns {Promise.<void>}
   */
  storeNewFavorites(newFavorites) {
    return this.loader.storeNewFavorites(newFavorites);
  }

  /**
   * @returns {Post[]}
   */
  getAllFavorites() {
    return this.loader.allFavorites;
  }

  /**
   * @returns {Promise.<void>}
   */
  storeAllFavorites() {
    return this.loader.storeAllFavorites();
  }

  /**
   * @returns {Post[]}
   */
  getLatestSearchResults() {
    return this.latestSearchResults;
  }

  /**
   * @param {String} searchQuery
   * @returns {Post[]}
   */
  getSearchResults(searchQuery) {
    this.filter.setSearchCommand(searchQuery);
    return this.getSearchResultsFromPreviousQuery();
  }

  /**
   * @returns {Post[]}
   */
  getSearchResultsFromPreviousQuery() {
    const favorites = this.filter.filterFavorites(this.loader.getAllFavorites());

    this.latestSearchResults = FavoritesSorter.sort(favorites);
    return this.latestSearchResults;
  }

  /**
   * @returns {Post[]}
   */
  getShuffledSearchResults() {
    this.latestSearchResults = Utils.shuffleArray(this.latestSearchResults);
    return Utils.shuffleArray(this.latestSearchResults);
  }

  /**
   * @returns {Post[]}
   */
  getInvertedSearchResults() {
    for (const favorite of this.loader.getAllFavorites()) {
      favorite.toggleMatchedByMostRecentSearch();
    }
    return this.loader.getAllFavorites()
      .filter(favorite => favorite.matchedByLatestSearch);
  }

  /**
   * @param {Boolean} value
   */
  toggleBlacklist(value) {
    this.filter.toggleBlacklist(value);
  }

  /**
   * @param {Number} allowedRatings
   */
  changeAllowedRatings(allowedRatings) {
    this.filter.setAllowedRatings(allowedRatings);
  }

  /**
   * @param {String} id
   */
  updateMetadata(id) {
    this.loader.updateMetadataInDatabase(id);
  }
}
