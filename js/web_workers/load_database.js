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
    this.createObjectStore();
  }

  createObjectStore() {
    this.openConnection((event) => {
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

        transaction.oncomplete = (event) => {
          postMessage({
            response: "finishedStoring"
          });
          database.close();
        };

        transaction.onerror = (event) => {
          console.error(event.target.result);
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
  async loadFavorites(idsToDelete) {
    let loadedFavorites = {};

    await this.openConnection()
      .then(async(connectionEvent) => {
        /**
         * @type {IDBDatabase}
        */
        const database = connectionEvent.target.result;
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
let favoritesDatabase;

onmessage = (message) => {
  const request = message.data;

  switch (request.command) {
    case "create":
      favoritesDatabase = new FavoritesDatabase(request.objectStoreName, request.version);
      break;

    case "store":
      favoritesDatabase.storeFavorites(request.favorites);
      break;

    case "load":
      favoritesDatabase.loadFavorites(request.deletedIds);
      break;

    case "update":
      favoritesDatabase.updateFavorites(request.favorites);
      break;

    default:
      break;
  }
};
