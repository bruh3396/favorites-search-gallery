class FavoritesLoader {
  /** @type {FavoritesFetcher} */
  fetcher;
  /** @type {FavoritesDatabase} */
  database;
  /** @type {Post[]} */
  allFavorites;
  /** @type {Boolean} */
  useSearchSubset = false;
  /** @type {Post[]} */
  subsetFavorites;

  /** @type {Set<String>} */
  get allFavoriteIds() {
    return new Set(Array.from(this.allFavorites.values()).map(post => post.id));
  }

  constructor() {
    this.allFavorites = [];
    this.subsetFavorites = [];
    this.fetcher = new FavoritesFetcher();
    this.database = new FavoritesDatabase();
  }

  /**
   * @returns {Promise<Post[]>}
   */
  loadAllFavorites() {
    return this.database.loadAllFavorites()
      .then((favorites) => {
        if (favorites.length === 0) {
          throw new EmptyFavoritesDatabaseError();
        }
        this.allFavorites = favorites;
        return favorites;
      });
  }

  /**
   * @param {Function} onFavoritesFound
   * @returns {Promise<void>}
   */
  fetchAllFavorites(onFavoritesFound) {
    const onFavoritesFoundHelper = (/** @type {Post[]} */ favorites) => {
      this.allFavorites = this.allFavorites.concat(favorites);
      return onFavoritesFound(favorites);
    };
    return this.fetcher.fetchAllFavorites(onFavoritesFoundHelper);
  }

  /**
   * @returns {Promise<Post[]>}
   */
  fetchFavoritesOnReload() {
    return this.fetcher.fetchNewFavoritesOnReload(this.allFavoriteIds)
      .then((newFavorites) => {
        this.allFavorites = newFavorites.concat(this.allFavorites);
        return newFavorites;
      });
  }

  /**
   * @returns {Post[]}
   */
  getAllFavorites() {
    return this.useSearchSubset ? this.subsetFavorites : this.allFavorites;
  }

  /**
   * @returns {Promise<void>}
   */
  storeAllFavorites() {
    return this.database.storeAllFavorites(this.allFavorites);
  }

  /**
   * @param {Post[]} newFavorites
   * @returns {Promise<void>}
   */
  storeNewFavorites(newFavorites) {
    return this.database.storeFavorites(newFavorites);
  }

  /**
   * @param {String} id
   */
  updateMetadataInDatabase(id) {
    this.database.updateMetadataInDatabase(id);
  }

  /**
   * @param {String} id
   * @returns {Promise<void>}
   */
  deleteFavorite(id) {
    return this.database.deleteFavorite(id);
  }

  /**
   * @param {Post[]} searchResults
   */
  setSearchSubset(searchResults) {
    this.useSearchSubset = true;
    this.subsetFavorites = searchResults;
  }

  stopSearchSubset() {
    this.useSearchSubset = false;
    this.subsetFavorites = [];
  }
}
