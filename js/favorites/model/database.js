class FavoritesDatabase {
  static databaseName = "Favorites";
  static objectStoreName = `user${Utils.getFavoritesPageId()}`;

  /** @type {Database<FavoritesDatabaseRecord>} */
  database;
  /** @type {String[]} */
  favoriteIdsRequiringMetadataDatabaseUpdate;
  /** @type {Timeout} */
  newMetadataReceivedTimeout;

  constructor() {
    this.favoriteIdsRequiringMetadataDatabaseUpdate = [];
    this.newMetadataReceivedTimeout = null;
    this.database = new Database(FavoritesDatabase.databaseName);
  }

  /**
   * @returns {Promise<Post[]>}
   */
  async loadAllFavorites() {
    const records = await this.database.load(FavoritesDatabase.objectStoreName);

    await this.database.deleteRecords(this.getIdsToDeleteOnReload(), FavoritesDatabase.objectStoreName);
    return this.deserialize(records);
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
  async storeFavorites(favorites) {
    const posts = favorites.slice().reverse().map(favorite => favorite.databaseRecord);

    await Utils.sleep(500);
    this.database.store(posts, FavoritesDatabase.objectStoreName);
  }

  /**
   * @param {Post[]} favorites
   */
  updateFavorites(favorites) {
    this.database.update(favorites.map(favorite => favorite.databaseRecord), FavoritesDatabase.objectStoreName);
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
  deserialize(records) {
    return records.map(record => new Post(record));
  }
}
