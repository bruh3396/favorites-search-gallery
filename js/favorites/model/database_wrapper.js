class FavoritesDatabaseWrapper {
  static databaseName = "Favorites";
  static objectStoreName = `user${Utils.getFavoritesPageId()}`;
  /**
   * @type {FavoritesDatabase}
   */
  database;
  /**
   * @type {String[]}
   */
  favoriteIdsRequiringMetadataDatabaseUpdate;
  /**
   * @type {Timeout}
   */
  newMetadataReceivedTimeout;

  constructor() {
    this.favoriteIdsRequiringMetadataDatabaseUpdate = [];
    this.newMetadataReceivedTimeout = null;
    this.database = new FavoritesDatabase(FavoritesDatabaseWrapper.objectStoreName, 1);
  }

  /**
   * @returns {Promise<Post[]>}
   */
  loadAllFavorites() {
    return this.database.loadFavorites(this.getIdsToDeleteOnReload())
      .then((records) => {
        return this.deserializeFavorites(records);
      });
  }

  /**
   * @param {Post[]} favorites
   * @returns {Promise<void>}
   */
  storeAllFavorites(favorites) {
    return this.storeFavorites(favorites);
  }

  /**
   * @param {Post[]} favorites
   * @returns {Promise<void>}
   */
  storeFavorites(favorites) {
    const posts = favorites
    .slice()
    .reverse()
    .map(favorite => favorite.databaseRecord);
    return Utils.sleep(500)
      .then(() => {
        this.database.storeFavorites(posts);
      });
  }

  /**
   * @param {Post[]} favorites
   */
  updateFavorites(favorites) {
    this.database.updateFavorites(favorites.map(favorite => favorite.databaseRecord));
  }

  /**
   * @returns {String[]}
   */
  getIdsToDeleteOnReload() {
    if (Flags.userIsOnTheirOwnFavoritesPage) {
      const idsToDelete = Utils.getIdsToDeleteOnReload();

      Utils.clearIdsToDeleteOnReload();
      return idsToDelete;
    }
    return [];
  }

  /**
   * @param {String} id
   */
  updateMetadataInDatabase(id) {
    if (!Post.allPosts.has(id)) {
      return;
    }
    const batchSize = 100;
    const waitTime = 1000;

    clearTimeout(this.newMetadataReceivedTimeout);
    this.favoriteIdsRequiringMetadataDatabaseUpdate.push(id);

    if (this.favoriteIdsRequiringMetadataDatabaseUpdate.length >= batchSize) {
      this.batchUpdateMetadataInDatabase();
      return;
    }
    this.newMetadataReceivedTimeout = setTimeout(() => {
      this.batchUpdateMetadataInDatabase();
    }, waitTime);
  }

  batchUpdateMetadataInDatabase() {
    const favoritesToUpdate = this.favoriteIdsRequiringMetadataDatabaseUpdate
      .map(id => Post.allPosts.get(id))
      .filter(post => post !== undefined);

    this.updateFavorites(favoritesToUpdate);
    this.favoriteIdsRequiringMetadataDatabaseUpdate = [];
  }

  /**
   * @param {FavoritesDatabaseRecord[]} records
   * @returns {Post[]}
   */
  deserializeFavorites(records) {
    return records.map(record => new Post(record));
  }
}
