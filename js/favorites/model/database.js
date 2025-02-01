class FavoritesDatabaseInterface {
  static databaseName = "Favorites";
  static objectStoreName = `user${Utils.getFavoritesPageId()}`;
  /**
   * @type {Function}
   */
  onFavoritesStored;
  /**
   * @type {Function}
   */
  onFavoritesLoaded;
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

  /**
   *
   * @param {{onFavoritesStored: Function, onFavoritesLoaded: Function}} param
   */
  constructor({onFavoritesStored, onFavoritesLoaded}) {
    this.databaseWorker = new Worker(Utils.getWorkerURL(WebWorkers.webWorkers.database));
    this.onFavoritesStored = onFavoritesStored;
    this.onFavoritesLoaded = onFavoritesLoaded;
    this.favoriteIdsRequiringMetadataDatabaseUpdate = [];
    this.newMetadataReceivedTimeout = null;
    this.initializeDatabase();
  }

  initializeDatabase() {
    this.connectDatabaseMessagesToCallbacks();
    this.sendObjectStoreNameToDatabase();
  }

  createDatabaseWorker() {
  }

  connectDatabaseMessagesToCallbacks() {
    this.databaseWorker.onmessage = (message) => {
      switch (message.data.response) {
        case "finishedLoading":
          this.onFavoritesLoaded(this.deserializeFavorites(message.data.favorites));
          break;

        case "finishedStoring":
          this.onFavoritesStored();
          break;

        default:
          break;
      }
    };
  }

  sendObjectStoreNameToDatabase() {
    this.databaseWorker.postMessage({
      command: "create",
      objectStoreName: FavoritesDatabaseInterface.objectStoreName,
      version: 1
    });
  }

  loadAllFavorites() {
    this.databaseWorker.postMessage({
      command: "load",
      idsToDelete: this.getIdsToDeleteOnReload()
    });
  }

  /**
   * @param {Post[]} favorites
   */
  storeAllFavorites(favorites) {
    this.storeFavorites(favorites.slice().reverse());
  }

  /**
   * @param {Post[]} favorites
   */
  storeFavorites(favorites) {
    setTimeout(() => {
      this.databaseWorker.postMessage({
        command: "store",
        favorites: favorites.map(favorite => favorite.databaseRecord)
      });
    }, 500);
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
    const batchSize = 500;
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
    return records.map(record => new Post(record, true));
  }
}
