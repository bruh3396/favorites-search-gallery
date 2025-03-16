/**
 * @template V
 */
class Database {
  /** @type {String} */
  name;
  /** @type {Number} */
  version;

  /**
   * @param {String} name
   * @param {Number} version
   */
  constructor(name, version = 2) {
    this.name = name;
    this.version = version;
  }

  /**
   * @param {String} objectStoreName
   * @returns {Promise<V[]>}
   */
  async load(objectStoreName) {
    const database = await this.open(objectStoreName);
    return this.getAllRecords(database, objectStoreName);
  }

  /**
   * @param {(V & {id: String})[]} records
   * @param {String} objectStoreName
   * @returns {Promise<void>}
   */
  async store(records, objectStoreName) {
    const database = await this.open(objectStoreName);
    const transaction = database.transaction(objectStoreName, "readwrite");
    const objectStore = transaction.objectStore(objectStoreName);
    return new Promise((resolve, reject) => {
      transaction.onerror = reject;
      records.forEach(record => {
        objectStore.put(record);
      });
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
    });
  }

  /**
   * @param {(V & {id: String})[]} records
   * @param {String} objectStoreName
   */
  async update(records, objectStoreName) {
    const database = await this.open(objectStoreName);
    const transaction = database.transaction(objectStoreName, "readwrite");
    const objectStore = transaction.objectStore(objectStoreName);
    const index = objectStore.index("id");
    let updatedCount = 0;

    records.forEach(record => {
      const i = index.getKey(record.id);

      i.onsuccess = (indexEvent) => {
        // @ts-ignore
        const primaryKey = indexEvent.target.result;

        objectStore.put(record, primaryKey);
        updatedCount += 1;

        if (updatedCount >= records.length) {
          database.close();
        }
      };
    });
  }

  /**
   * @param {String} objectStoreName
   * @returns {Promise<IDBDatabase>}
   */
  open(objectStoreName) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, this.version);

      this.createIDBOpenSuccessHandler(request, resolve, reject, objectStoreName);
      this.createIDBOpenErrorHandler(request, reject);
      this.createIDBOpenUpgradeNeededHandler(request, objectStoreName);
    }).catch((error) => {
      return this.handleIDBOpenError(error, objectStoreName);
    });
  }

  /**
   * @param {IDBDatabase} database
   * @param {String} objectStoreName
   * @returns {Promise<V[]>}
   */
  getAllRecords(database, objectStoreName) {
    const transaction = database.transaction(objectStoreName, "readwrite");
    const objectStore = transaction.objectStore(objectStoreName);
    return new Promise((resolve, reject) => {
      transaction.onerror = (event) => {
        reject(event);
      };
      const getAllRequest = objectStore.getAll();

      getAllRequest.onsuccess = (event) => {
        database.close();

        if (!(event.target instanceof IDBRequest)) {
          reject(event);
          return;
        }
        resolve(event.target.result.reverse());
      };
      getAllRequest.onerror = (event) => {
        database.close();
        reject(event);
      };
    });
  }

  /**
   * @param {IDBOpenDBRequest} request
   * @param {(value: IDBOpenDBRequest) => void} reject
   */
  createIDBOpenErrorHandler(request, reject) {
    request.onerror = (event) => {
      if (!(event.target instanceof IDBOpenDBRequest)) {
        throw new IndexedDBUnexpectedError();
      }
      reject(event.target);
    };
  }

  /**
   * @param {IDBOpenDBRequest} request
   * @param {String} objectStoreName
   */
  createIDBOpenUpgradeNeededHandler(request, objectStoreName) {
    request.onupgradeneeded = (event) => {
      this.handleIDBOpenUpgradeNeeded(event, objectStoreName);
    };
  }

  /**
   * @param {IDBVersionChangeEvent} event
   * @param {String} objectStoreName
   */
  handleIDBOpenUpgradeNeeded(event, objectStoreName) {
    if (!(event.target instanceof IDBOpenDBRequest)) {
      throw new IndexedDBUnexpectedError();
    }
    this.createObjectStore(event.target, objectStoreName);
  }

  /**
   * @param {any} request
   * @param {String} objectStoreName
   * @returns {Promise<IDBDatabase>}
   */
  handleIDBOpenError(request, objectStoreName) {
    if (request instanceof IDBOpenDBRequest || request instanceof DOMException || request instanceof UnknownObjectStoreError) {
      this.version += 1;
      return this.open(objectStoreName);
    }
    throw new IndexedDBUnexpectedError();
  }

  /**
   * @param {IDBOpenDBRequest} request
   * @param {(value: IDBDatabase) => void} resolve
   * @param {(value: UnknownObjectStoreError) => void} reject
   * @param {String} objectStoreName
   */
  createIDBOpenSuccessHandler(request, resolve, reject, objectStoreName) {
    request.onsuccess = (event) => {
      if (!(event.target instanceof IDBOpenDBRequest)) {
        throw new IndexedDBUnexpectedError();
      }

      if (!event.target.result.objectStoreNames.contains(objectStoreName)) {
        event.target.result.close();
        reject(new UnknownObjectStoreError());
        return;
      }
      resolve(event.target.result);
    };
  }

  /**
   * @param {IDBOpenDBRequest} request
   * @param {String} objectStoreName
   */
  createObjectStore(request, objectStoreName) {
    const database = request.result;

    if (database.objectStoreNames.contains(objectStoreName)) {
      return;
    }
    const objectStore = database.createObjectStore(objectStoreName, {
      autoIncrement: true
    });

    objectStore.createIndex("id", "id", {
      unique: true
    });
  }

  /**
   * @param {String[]} ids
   * @param {String} objectStoreName
   */
  async deleteRecords(ids, objectStoreName) {
    const database = await this.open(objectStoreName);
    const transaction = database.transaction(objectStoreName, "readwrite");
    const objectStore = transaction.objectStore(objectStoreName);
    const index = objectStore.index("id");

    for (const id of ids) {
      await this.deleteRecord(index, id, objectStore);
    }
  }

  /**
   * @param {IDBIndex} index
   * @param {String} id
   * @param {IDBObjectStore} objectStore
   */
  async deleteRecord(index, id, objectStore) {
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
