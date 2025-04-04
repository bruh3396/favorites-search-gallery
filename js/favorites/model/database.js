class FavoritesDatabase {
  static databaseName = "Favorites";
  static objectStoreName = `user${Utils.getFavoritesPageId()}`;

  /** @type {Database<FavoritesDatabaseRecord>} */
  database;
  /** @type {BatchExecutor<Post>} */
  metadataUpdater;

  constructor() {
    this.database = new Database(FavoritesDatabase.databaseName);
    this.metadataUpdater = new BatchExecutor(100, 1000, this.updateFavorites.bind(this));
  }

  /**
   * @returns {Promise<Post[]>}
   */
  async loadAllFavorites() {
    // await this.deleteFavorites();
    const records = await this.database.load(FavoritesDatabase.objectStoreName);
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
   * @param {String} id
   */
  updateMetadataInDatabase(id) {
    const post = Post.allPosts.get(id);

    if (post !== undefined) {
      this.metadataUpdater.add(post);
    }
  }

  /**
   * @param {FavoritesDatabaseRecord[]} records
   * @returns {Post[]}
   */
  deserialize(records) {
    return records.map(record => new Post(record));
  }

  /**
   * @param {String} id;
   * @returns {Promise<void>}
   */
  deleteFavorite(id) {
    return this.database.deleteRecords([id], FavoritesDatabase.objectStoreName);
  }
}
