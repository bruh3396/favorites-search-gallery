class FavoritesDatabaseWrapper {
  static databaseName = "Favorites";
  static objectStoreName = `user${Utils.getFavoritesPageId()}`;
  static webWorkers = {
    database:
`
/* eslint-disable prefer-template */
/**
 * @param {Number} milliseconds
 * @returns {Promise}
 */
function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

class FavoritesDatabase {
  /**
   * @type {String}
   */
  name = "Favorites";
  /**
   * @type {String}
   */
  objectStoreName;
  /**
   * @type {Number}
   */
  version;

  /**
   * @param {String} objectStoreName
   * @param {Number | String} version
   */
  constructor(objectStoreName, version) {
    this.objectStoreName = objectStoreName;
    this.version = version;
  }

  createObjectStore() {
    return this.openConnection((event) => {
      /**
       * @type {IDBDatabase}
       */
      const database = event.target.result;
      const objectStore = database
        .createObjectStore(this.objectStoreName, {
          autoIncrement: true
        });

      objectStore.createIndex("id", "id", {
        unique: true
      });
    }).then((event) => {
      event.target.result.close();
    });
  }

  /**
   * @param {Function} onUpgradeNeeded
   * @returns {Promise}
   */
  openConnection(onUpgradeNeeded) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, this.version);

      request.onsuccess = resolve;
      request.onerror = reject;
      request.onupgradeneeded = onUpgradeNeeded;
    });
  }

  /**
   * @param {[{id: String, tags: String, src: String, metadata: String}]} favorites
   */
  storeFavorites(favorites) {
    this.openConnection()
      .then((connectionEvent) => {
        /**
         * @type {IDBDatabase}
         */
        const database = connectionEvent.target.result;
        const transaction = database.transaction(this.objectStoreName, "readwrite");
        const objectStore = transaction.objectStore(this.objectStoreName);

        transaction.oncomplete = () => {
          postMessage({
            response: "finishedStoring"
          });
          database.close();
        };

        transaction.onerror = (event) => {
          console.error(event);
        };

        favorites.forEach(favorite => {
          this.addContentTypeToFavorite(favorite);
          objectStore.put(favorite);
        });

      })
      .catch((event) => {
        const error = event.target.error;

        if (error.name === "VersionError") {
          this.version += 1;
          this.storeFavorites(favorites);
        } else {
          console.error(error);
        }
      });
  }

  /**
   * @param {String[]} idsToDelete
   */
  loadFavorites(idsToDelete) {
    let loadedFavorites = {};
    let database;

    this.openConnection()
      .then(async(connectionEvent) => {
        /**
         * @type {IDBDatabase}
         */
        database = connectionEvent.target.result;
        const transaction = database.transaction(this.objectStoreName, "readwrite");
        const objectStore = transaction.objectStore(this.objectStoreName);
        const index = objectStore.index("id");

        transaction.onerror = (event) => {
          console.error(event);
        };
        transaction.oncomplete = () => {
          postMessage({
            response: "finishedLoading",
            favorites: loadedFavorites
          });
          database.close();
        };

        for (const id of idsToDelete) {
          const deleteRequest = index.getKey(id);

          await new Promise((resolve, reject) => {
            deleteRequest.onsuccess = resolve;
            deleteRequest.onerror = reject;
          }).then((indexEvent) => {
            const primaryKey = indexEvent.target.result;

            if (primaryKey !== undefined) {
              objectStore.delete(primaryKey);
            }
          }).catch((error) => {
            console.error(error);
          });
        }
        const getAllRequest = objectStore.getAll();

        getAllRequest.onsuccess = (event) => {
          loadedFavorites = event.target.result.reverse();
        };
        getAllRequest.onerror = (event) => {
          console.error(event);
        };
      }).catch(async(error) => {
        this.version += 1;

        if (error.name === "NotFoundError") {
          database.close();
          await this.createObjectStore();
        }
        this.loadFavorites(idsToDelete);
      });
  }

  /**
   * @param {[{id: String, tags: String, src: String, metadata: String}]} favorites
   */
  updateFavorites(favorites) {
    this.openConnection()
      .then((event) => {
        /**
         * @type {IDBDatabase}
         */
        const database = event.target.result;
        const favoritesObjectStore = database
          .transaction(this.objectStoreName, "readwrite")
          .objectStore(this.objectStoreName);
        const objectStoreIndex = favoritesObjectStore.index("id");
        let updatedCount = 0;

        favorites.forEach(favorite => {
          const index = objectStoreIndex.getKey(favorite.id);

          this.addContentTypeToFavorite(favorite);
          index.onsuccess = (indexEvent) => {
            const primaryKey = indexEvent.target.result;

            favoritesObjectStore.put(favorite, primaryKey);
            updatedCount += 1;

            if (updatedCount >= favorites.length) {
              database.close();
            }
          };
        });
      })
      .catch((event) => {
        const error = event.target.error;

        if (error.name === "VersionError") {
          this.version += 1;
          this.updateFavorites(favorites);
        } else {
          console.error(error);
        }
      });
  }

  /**
   * @param {{id: String, tags: String, src: String, metadata: String}} favorite
   */
  addContentTypeToFavorite(favorite) {
    const tags = favorite.tags + " ";
    const isAnimated = tags.includes("animated ") || tags.includes("video ");
    const isGif = isAnimated && !tags.includes("video ");

    favorite.type = isGif ? "gif" : isAnimated ? "video" : "image";
  }
}

/**
 * @type {FavoritesDatabase}
 */
const favoritesDatabase = new FavoritesDatabase(null, 1);

onmessage = (message) => {
  const request = message.data;

  switch (request.command) {
    case "create":
      favoritesDatabase.objectStoreName = request.objectStoreName;
      favoritesDatabase.version = request.version;
      break;

    case "store":
      favoritesDatabase.storeFavorites(request.favorites);
      break;

    case "load":
      favoritesDatabase.loadFavorites(request.idsToDelete);
      break;

    case "update":
      favoritesDatabase.updateFavorites(request.favorites);
      break;

    default:
      break;
  }
};

`
  };

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
    this.addEventListeners();
    this.initializeDatabase();
  }

  addEventListeners() {
    window.addEventListener("missingMetadata", (event) => {
      this.addNewMetadata(event.detail);
    });
  }

  initializeDatabase() {
    this.databaseWorker = new Worker(Utils.getWorkerURL(FavoritesDatabaseWrapper.webWorkers.database));
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
