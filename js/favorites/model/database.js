class FavoritesDatabase {
  /* eslint-disable prefer-template */
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
   * @param {Number} version
   */
  constructor(objectStoreName, version) {
    this.objectStoreName = objectStoreName;
    this.version = version;
  }

  createObjectStore() {
    this.openConnection((event) => {
      /**
       * @type {IDBDatabase}
       */
      const database = event.target.result;
      const objectStore = database.createObjectStore(this.objectStoreName, {
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
   * @returns {Promise<any>}
   */
  openConnection(onUpgradeNeeded = () => { }) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, this.version);

      request.onsuccess = resolve;
      request.onerror = reject;
      // @ts-ignore
      request.onupgradeneeded = onUpgradeNeeded;
    });
  }

  /**
   * @param {IDBDatabase} database
   * @returns {{index: IDBIndex, objectStore: IDBObjectStore, transaction: IDBTransaction}}
   */
  createReadWriteTransaction(database) {
    const transaction = database.transaction(this.objectStoreName, "readwrite");
    const objectStore = transaction.objectStore(this.objectStoreName);
    const index = objectStore.index("id");
    return {
      index,
      objectStore,
      transaction
    };
  }

  /**
   * @param {String[]} idsToDelete
   * @param {IDBIndex} index
   * @param {IDBObjectStore} objectStore
   */
  async deleteFavorites(idsToDelete, index, objectStore) {
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
  }

  /**
   * @param {IDBDatabase} database
   * @param {IDBTransaction} transaction
   * @param {IDBObjectStore} objectStore
   * @returns {Promise<any>}
   */
  getAllFavorites(database, transaction, objectStore) {
    return new Promise((resolve, reject) => {
      transaction.onerror = (event) => {
        console.error(event);
        reject(event);
      };
      const getAllRequest = objectStore.getAll();

      getAllRequest.onsuccess = (event) => {
        // @ts-ignore
        database.close();
        // @ts-ignore
        resolve(event.target.result.reverse());
      };
      getAllRequest.onerror = (event) => {
        database.close();
        reject(event);
      };
    });
  }

  /**
   * @param {any} error
   * @returns {Promise<void>}
   */
  async incrementVersionOnLoad(error) {
    this.version += 1;

    if (error.name === "NotFoundError") {
      await this.createObjectStore();
    }
  }

  /**
   * @param {String[]} idsToDelete
   * @returns {Promise<any>}
   */
  loadFavorites(idsToDelete) {
    /**
     * @type {IDBDatabase}
     */
    let database;
    return this.openConnection()
      .then(async(connectionEvent) => {
        database = connectionEvent.target.result;
        const {index, objectStore, transaction} = this.createReadWriteTransaction(database);

        await this.deleteFavorites(idsToDelete, index, objectStore);
        return this.getAllFavorites(database, transaction, objectStore);
      }).catch(async(error) => {
        await this.incrementVersionOnLoad(error);
        database?.close();
        return this.loadFavorites(idsToDelete);
      });
  }

  /**
   * @param {FavoritesDatabaseRecord[]} favorites
   * @returns {Promise<void>}
   */
  storeFavorites(favorites) {
    return this.openConnection()
      .then((connectionEvent) => {
        /**
         * @type {IDBDatabase}
         */
        const database = connectionEvent.target.result;
        const {objectStore, transaction} = this.createReadWriteTransaction(database);
        return new Promise((resolve, reject) => {
          transaction.onerror = (event) => {
            reject(event);
          };

          favorites.forEach(favorite => {
            this.addContentTypeToFavorite(favorite);
            objectStore.put(favorite);
          });

          transaction.oncomplete = () => {
            database.close();
            resolve(0);
          };
        });

      })
      .catch((event) => {
        this.incrementVersionOnStore(event, favorites);
      });
  }

  incrementVersionOnStore(event, favorites) {
    const error = event.target.error;

    if (error.name === "VersionError") {
      this.version += 1;
      this.storeFavorites(favorites);
    } else {
      console.error(event);
    }
  }

  /**
   * @param {FavoritesDatabaseRecord[]} favorites
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
            // @ts-ignore
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
   * @param {FavoritesDatabaseRecord} favorite
   */
  addContentTypeToFavorite(favorite) {
    const tags = favorite.tags + " ";
    const isAnimated = tags.includes("animated ") || tags.includes("video ");
    const isGif = isAnimated && !tags.includes("video ");

    // @ts-ignore
    favorite.type = isGif ? "gif" : isAnimated ? "video" : "image";
  }
}
