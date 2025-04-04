class FavoritesModel {
  /** @type {FavoritesLoader} */
  loader;
  /** @type {FavoritesFilter} */
  filter;
  /** @type {FavoritesSorter} */
  sorter;
  /** @type {FavoritesPaginator} */
  paginator;
  /** @type {InfiniteScrollFeeder} */
  feeder;
  /** @type {FavoritesDownloader} */
  downloader;
  /** @type {Post[]} */
  latestSearchResults;
  /** @type {Boolean} */
  infiniteScroll;

  constructor() {
    this.loader = new FavoritesLoader();
    this.filter = new FavoritesFilter();
    this.sorter = new FavoritesSorter();
    this.paginator = new FavoritesPaginator();
    this.feeder = new InfiniteScrollFeeder();
    this.downloader = new FavoritesDownloader();
    this.latestSearchResults = [];
    this.infiniteScroll = Preferences.infiniteScroll.value;
  }

  /**
   * @returns {Promise<Post[]>}
   */
  loadAllFavorites() {
    return this.loader.loadAllFavorites()
      .then(() => {
        return this.getSearchResults("");
      });
  }

  /**
   * @param {Function} onSearchResultsFound
   * @returns {Promise<void>}
   */
  fetchAllFavorites(onSearchResultsFound) {
    const onFavoritesFound = (/** @type {Post[]} */ favorites) => {
      this.latestSearchResults = this.latestSearchResults.concat(this.filter.filterFavorites(favorites));
      return onSearchResultsFound();
    };
    return this.loader.fetchAllFavorites(onFavoritesFound);
  }

  /**
   * @returns {Promise<{newFavorites: Post[], newSearchResults: Post[], allSearchResults: Post[]}>}
   */
  findNewFavoritesOnReload() {
    return this.loader.fetchFavoritesOnReload()
      .then((newFavorites) => {
        const newSearchResults = this.filter.filterFavorites(newFavorites);

        this.latestSearchResults = newSearchResults.concat(this.latestSearchResults);
        return {
          newFavorites,
          newSearchResults,
          allSearchResults: this.latestSearchResults
        };
      });
  }

  /**
   * @param {Post[]} newFavorites
   * @returns {Promise<void>}
   */
  storeNewFavorites(newFavorites) {
    return this.loader.storeNewFavorites(newFavorites);
  }

  /**
   * @returns {Post[]}
   */
  getAllFavorites() {
    return this.loader.getAllFavorites();
  }

  /**
   * @returns {Promise<void>}
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
    const favorites = this.filter.filterFavorites(this.getAllFavorites());

    this.latestSearchResults = this.sorter.sortFavorites(favorites);
    return this.latestSearchResults;
  }

  /**
   * @returns {Post[]}
   */
  getShuffledSearchResults() {
    return Utils.shuffleArray(this.latestSearchResults);
  }

  invertSearchResults() {
    for (const favorite of this.getAllFavorites()) {
      favorite.toggleMatchedByMostRecentSearch();
    }
    const searchResults = this.getAllFavorites()
      .filter(favorite => favorite.matchedByLatestSearch);

    this.latestSearchResults = this.filter.filterFavoritesByRating(searchResults);
  }

  /**
   * @param {Post[]} searchResults
   */
  paginate(searchResults) {
    this.paginator.paginate(searchResults);
  }

  /**
   * @param {Number} pageNumber
   */
  changePage(pageNumber) {
    this.paginator.changePage(pageNumber);
  }

  /**
   * @returns {Post[]}
   */
  getFavoritesOnCurrentPage() {
    return this.paginator.getFavoritesOnCurrentPage();
  }

  /**
   * @param {NavigationKey} direction
   * @returns {Boolean}
   */
  gotoAdjacentPage(direction) {
    return this.paginator.gotoAdjacentPage(direction);
  }

  /**
   * @param {String} relation
   * @returns {Boolean}
   */
  gotoRelativePage(relation) {
    return this.paginator.gotoRelativePage(relation);
  }

  /**
   * @param {String} id
   * @returns {Boolean}
   */
  gotoPageWithFavorite(id) {
    return this.paginator.gotoPageWithFavorite(id);
  }

  /**
   * @returns {FavoritesPaginationParameters}
   */
  getPaginationParameters() {
    return this.paginator.paginationParameters;
  }

  /**
   * @returns {Boolean}
   */
  onFinalPage() {
    return this.paginator.onFinalPage;
  }

  /**
   * @param {Boolean} value
   */
  toggleBlacklist(value) {
    this.filter.toggleBlacklist(value);
  }

  /**
   * @param {Rating} allowedRatings
   */
  changeAllowedRatings(allowedRatings) {
    this.filter.setAllowedRatings(allowedRatings);
  }

  /**
   * @param {MetadataMetric} sortingMethod
   */
  setSortingMethod(sortingMethod) {
    this.sorter.setSortingMethod(sortingMethod);
  }

  /**
   * @param {Boolean} value
   */
  toggleSortAscending(value) {
    this.sorter.setAscendingOrder(value);
  }

  /**
   * @param {String} id
   */
  updateMetadata(id) {
    this.loader.updateMetadataInDatabase(id);
  }

  /**
   * @param {Number} resultsPerPage
   */
  changeResultsPerPage(resultsPerPage) {
    this.paginator.changeResultsPerPage(resultsPerPage);
  }

  downloadSearchResults() {
    this.downloader.downloadFavorites(this.latestSearchResults);
  }

  /**
   * @param {Boolean} value
   */
  toggleInfiniteScroll(value) {
    this.infiniteScroll = value;
  }

  /**
   * @returns {Post[]}
   */
  getNextInfiniteScrollBatch() {
    return this.feeder.getNextBatch(this.latestSearchResults);
  }

  /**
   * @param {String} id
   * @returns {Promise<void>}
   */
  deleteFavorite(id) {
    return this.loader.deleteFavorite(id);
  }

  setSearchSubset() {
    this.loader.setSearchSubset(this.latestSearchResults);
  }

  stopSearchSubset() {
    this.loader.stopSearchSubset();
  }
}
