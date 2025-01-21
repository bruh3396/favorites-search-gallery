class FavoritesDatabaseWrapper {
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
   * @type {Number}
   */
  newMetadataReceivedTimeout;

  /**
   * @param {Function} onFavoritesStored
   * @param {Function} onFavoritesLoaded
   */
  constructor(onFavoritesStored, onFavoritesLoaded) {
    this.onFavoritesStored = onFavoritesStored;
    this.onFavoritesLoaded = onFavoritesLoaded;
    this.favoriteIdsRequiringMetadataDatabaseUpdate = [];
    this.initializeDatabase();
  }

  initializeDatabase() {
    this.databaseWorker = new Worker(Utils.getWorkerURL(WebWorkers.webWorkers.database));
    this.databaseWorker.onmessage = (message) => {
      switch (message.data.response) {
        case "finishedLoading":
          this.onFavoritesLoaded(message.data.favorites);
          break;

        case "finishedStoring":
          this.onFavoritesStored();
          break;

        default:
          break;
      }
    };
    this.databaseWorker.postMessage({
      command: "create",
      objectStoreName: FavoritesDatabaseWrapper.objectStoreName,
      version: 1
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
   * @param {Post[]} favorites
   */
  storeAllFavorites(favorites) {
    this.storeFavorites(favorites.slice().reverse());
  }

  /**
   * @param {Post[]} favorites
   */
  async storeFavorites(favorites) {
    await Utils.sleep(500);

    this.databaseWorker.postMessage({
      command: "store",
      favorites: favorites.map(post => post.databaseRecord)
    });
  }

  loadAllFavorites() {
    this.databaseWorker.postMessage({
      command: "load",
      idsToDelete: this.getIdsToDeleteOnReload()
    });
  }

  /**
   * @param {String} postId
   */
  addNewMetadata(postId) {
    if (!Post.allPosts.has(postId)) {
      return;
    }
    const batchSize = 500;
    const waitTime = 1000;

    clearTimeout(this.newMetadataReceivedTimeout);
    this.favoriteIdsRequiringMetadataDatabaseUpdate.push(postId);

    if (this.favoriteIdsRequiringMetadataDatabaseUpdate.length >= batchSize) {
      this.updateMetadataInDatabase();
      return;
    }
    this.newMetadataReceivedTimeout = setTimeout(() => {
      this.updateMetadataInDatabase();
    }, waitTime);
  }

  updateMetadataInDatabase() {
    this.updateFavorites(this.favoriteIdsRequiringMetadataDatabaseUpdate.map(id => Post.allPosts.get(id)));
    this.favoriteIdsRequiringMetadataDatabaseUpdate = [];
  }

  /**
   * @param {Post[]} posts
   */
  updateFavorites(posts) {
    this.databaseWorker.postMessage({
      command: "update",
      favorites: posts.map(post => post.databaseRecord)
    });
  }
}
