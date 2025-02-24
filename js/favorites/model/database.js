class FavoritesDatabaseInterface {
  static databaseName = "Favorites";
  static objectStoreName = `user${Utils.getFavoritesPageId()}`;
  /**
   * @type {Worker}
   */
  databaseWorker;
  /**
   * @type {String[]}
   */
  favoriteIdsRequiringMetadataDatabaseUpdate;
  /**
   * @type {Timeout}
   */
  newMetadataReceivedTimeout;

  constructor() {
    this.databaseWorker = new Worker(Utils.getWorkerURL(WebWorkers.webWorkers.database));
    this.favoriteIdsRequiringMetadataDatabaseUpdate = [];
    this.newMetadataReceivedTimeout = null;
    this.sendObjectStoreNameToDatabase();
  }

  sendObjectStoreNameToDatabase() {
    this.databaseWorker.postMessage({
      command: "create",
      objectStoreName: FavoritesDatabaseInterface.objectStoreName,
      version: 1
    });
  }

  /**
   * @returns {Promise.<Post[]>}
   */
  loadAllFavorites() {
    return Utils.sendPostedMessage(this.databaseWorker, {
      command: "load",
      idsToDelete: this.getIdsToDeleteOnReload()
    })
      .then((records) => {
        return this.deserializeFavorites(records);
      });
  }

  /**
   * @param {Post[]} favorites
   * @returns {Promise.<void>}
   */
  storeAllFavorites(favorites) {
    return this.storeFavorites(favorites);
  }

  /**
   * @param {Post[]} favorites
   * @returns {Promise.<void>}
   */
  storeFavorites(favorites) {
    return Utils.sleep(500)
      .then(() => {
        Utils.sendPostedMessage(this.databaseWorker, {
          command: "store",
          favorites: favorites
            .slice()
            .reverse()
            .map(favorite => favorite.databaseRecord)
        });
      });
  }

  /**
   * @param {Post[]} favorites
   */
  updateFavorites(favorites) {
    this.databaseWorker.postMessage({
      command: "update",
      favorites: favorites.map(favorite => favorite.databaseRecord)
    });
  }

  /**
   * @returns {String[]}
   */
  getIdsToDeleteOnReload() {
    if (Utils.userIsOnTheirOwnFavoritesPage()) {
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
   * @param {{ id: string; tags: string; src: string; metadata: string; }[]} records
   * @returns {Post[]}
   */
  deserializeFavorites(records) {
    return records.map(record => new Post(record));
  }
}
