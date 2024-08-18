/* eslint-disable prefer-template */
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
   * @param {[{id: String, tags: String, src: String}]} favorites
   */
  storeFavorites(favorites) {
    this.openConnection()
      .then((event) => {
        const database = event.target.result;
        const favoritesObjectStore = database
          .transaction(this.objectStoreName, "readwrite")
          .objectStore(this.objectStoreName);

        favorites.forEach(favorite => {
          this.addContentTypeToFavorite(favorite);
          favoritesObjectStore.add(favorite);
          database.close();
        });

        postMessage({
          response: "finishedStoring"
        });
      })
      .catch((event) => {
        const error = event.target.error;
        const errorType = error.name;

        if (errorType === "VersionError") {
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
    await this.openConnection()
      .then(async(event) => {
        const database = event.target.result;
        const objectStore = database
        .transaction(this.objectStoreName, "readwrite")
        .objectStore(this.objectStoreName);
      const index = objectStore.index("id");

      for (const id of idsToDelete) {
        const deleteRequest = index.getKey(id);

        await new Promise((resolve, reject) => {
          deleteRequest.onsuccess = resolve;
          deleteRequest.onerror = reject;
        }).then((event1) => {
          const primaryKey = event1.target.result;

          if (primaryKey !== undefined) {
            objectStore.delete(primaryKey);
          }
        });
      }
      objectStore.getAll().onsuccess = (successEvent) => {
        const results = successEvent.target.result.reverse();

        postMessage({
          response: "finishedLoading",
          favorites: results
        });
      };
      database.close();
      });

  }

  /**
   * @param {{id: String, tags: String, src: String}} favorite
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

    default:
      break;
  }
};
