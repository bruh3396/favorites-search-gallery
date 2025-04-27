class LockedDatabaseError extends Error { }

export class Database<V extends { id: string }> {
  private readonly name: string;
  private readonly defaultObjectStoreName: string;
  private version: number;
  private locked: boolean;

  constructor(name: string, defaultObjectStoreName: string, version: number = 1) {
    this.name = name;
    this.defaultObjectStoreName = defaultObjectStoreName;
    this.version = version;
    this.locked = false;
  }

  public async load(objectStoreName: string | undefined = undefined): Promise<V[]> {
    const database = await this.open(objectStoreName || this.defaultObjectStoreName);
    return this.getAllRecords(database, objectStoreName || this.defaultObjectStoreName);
  }

  public async store(records: V[], objectStoreName: string | undefined = undefined): Promise<void> {
    if (this.locked) {
      return Promise.reject(new LockedDatabaseError());
    }
    objectStoreName = objectStoreName || this.defaultObjectStoreName;
    const database = await this.open(objectStoreName);
    const transaction = database.transaction(objectStoreName, "readwrite");
    const objectStore = transaction.objectStore(objectStoreName);
    return new Promise((resolve, reject) => {
      transaction.onerror = reject;
      records.forEach(record => this.putRecord(objectStore, record));
      transaction.oncomplete = (): void => {
        database.close();
        resolve();
      };
    });
  }

  public async update(records: V[], objectStoreName: string | undefined = undefined): Promise<void> {
    if (this.locked) {
      return Promise.reject(new LockedDatabaseError());
    }
    objectStoreName = objectStoreName || this.defaultObjectStoreName;
    const database = await this.open(objectStoreName);
    const transaction = database.transaction(objectStoreName, "readwrite");
    const objectStore = transaction.objectStore(objectStoreName);
    const index = objectStore.index("id");
    return new Promise((resolve, reject) => {
      transaction.onerror = reject;
      records.forEach(record => {
        this.updateRecord(index, record, objectStore);
        transaction.oncomplete = (): void => {
          database.close();
          resolve();
        };
      });
    });
  }

  public async deleteRecords(ids: string[], objectStoreName: string|undefined = undefined): Promise<void> {
    objectStoreName = objectStoreName || this.defaultObjectStoreName;
    const database = await this.open(objectStoreName);
    const transaction = database.transaction(objectStoreName, "readwrite");
    const objectStore = transaction.objectStore(objectStoreName);
    const index = objectStore.index("id");

    for (const id of ids) {
      await this.deleteRecord(index, id, objectStore);
    }
  }

  public delete(): void {
    this.lock();
    setTimeout(() => {
      indexedDB.deleteDatabase(this.name);
    }, 0);
  }

  private updateRecord(index: IDBIndex, record: V, objectStore: IDBObjectStore): void {
    index.getKey(record.id).onsuccess = (indexEvent): void => {
      const target = indexEvent.target as IDBRequest<IDBValidKey | undefined>;
      const primaryKey = target.result;

      if (primaryKey === undefined) {
        console.error(`Record with id ${record.id} not found`);
        return;
      }
      this.putRecord(objectStore, record, primaryKey);
    };
  }

  private putRecord(objectStore: IDBObjectStore, record: V, key: IDBValidKey | undefined = undefined): void {
    if (this.locked) {
      throw new LockedDatabaseError();
    }
    objectStore.put(record, key);
  }

  private deleteRecord(index: IDBIndex, id: string, objectStore: IDBObjectStore): Promise<void> {
    return new Promise((resolve) => {
      const request = index.getKey(id);

      request.onsuccess = (event): void => {
        const target = event.target as IDBRequest;
        const primaryKey = target.result;

        if (primaryKey !== undefined) {
          objectStore.delete(primaryKey);
        }
        resolve();
      };
      request.onerror = (): void => {
        console.error(request.error);
        resolve();
      };
    });
  }

  private open(objectStoreName: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, this.version);

      request.onsuccess = (): void => resolve(request.result);
      request.onupgradeneeded = (): void => this.createObjectStore(request.result, objectStoreName);
      request.onerror = (): void => {
        if (request.error instanceof DOMException && request.error.name === "VersionError") {
          this.version += 1;
          this.open(objectStoreName).then(resolve, reject);
          return;
        }
        reject(request.error);
      };
    });
  }

  private getAllRecords(database: IDBDatabase, objectStoreName: string): Promise<V[]> {
    const transaction = database.transaction(objectStoreName, "readwrite");
    const objectStore = transaction.objectStore(objectStoreName);
    return new Promise((resolve, reject) => {
      transaction.onerror = (event): void => {
        reject(event);
      };
      const getAllRequest = objectStore.getAll();

      getAllRequest.onsuccess = (event): void => {
        database.close();

        if (!(event.target instanceof IDBRequest)) {
          reject(event);
          return;
        }
        resolve(event.target.result.reverse());
      };
      getAllRequest.onerror = (event): void => {
        database.close();
        reject(event);
      };
    });
  }

  private createObjectStore(database: IDBDatabase, objectStoreName: string): void {
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

  private lock(): void {
    this.locked = true;
  }
}
