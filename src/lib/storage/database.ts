/* eslint-disable max-classes-per-file */
import { yieldControl } from "@/lib/async/timing";

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

  public async readAll(objectStoreName: string | undefined = undefined): Promise<V[]> {
    const database = await this.open(objectStoreName ?? this.defaultObjectStoreName);
    return this.getAllRecords(database, objectStoreName ?? this.defaultObjectStoreName);
  }

  public async readAllIds(objectStoreName: string | undefined = undefined): Promise<string[]> {
    objectStoreName = objectStoreName ?? this.defaultObjectStoreName;
    const database = await this.open(objectStoreName);
    const transaction = database.transaction(objectStoreName, "readonly");
    const objectStore = transaction.objectStore(objectStoreName);
    const index = objectStore.index("id");
    return new Promise((resolve, reject) => {
      const ids: string[] = [];
      const request = index.openKeyCursor();

      request.onsuccess = (): void => {
        const cursor = request.result;

        if (cursor) {
          ids.push(cursor.key as string);
          cursor.continue();
          return;
        }
        database.close();
        resolve(ids);
      };
      request.onerror = (): void => {
        database.close();
        reject(request.error);
      };
    });
  }

  public async write(records: V[], objectStoreName: string | undefined = undefined): Promise<void> {
    if (this.locked) {
      return Promise.reject(new LockedDatabaseError());
    }

    if (records.length === 0) {
      return Promise.resolve();
    }
    objectStoreName = objectStoreName ?? this.defaultObjectStoreName;
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
    objectStoreName = objectStoreName ?? this.defaultObjectStoreName;
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

  public async delete(ids: string[], objectStoreName: string | undefined = undefined): Promise<void> {
    objectStoreName = objectStoreName || this.defaultObjectStoreName;
    const database = await this.open(objectStoreName);
    const transaction = database.transaction(objectStoreName, "readwrite");
    const objectStore = transaction.objectStore(objectStoreName);
    const index = objectStore.index("id");

    for (const id of ids) {
      await this.deleteRecord(index, id, objectStore);
    }
  }

  public async exists(objectStoreName: string | undefined = undefined): Promise<boolean> {
    objectStoreName = objectStoreName ?? this.defaultObjectStoreName;
    const databases = await indexedDB.databases();

    if (!databases.some(database => database.name === this.name)) {
      return false;
    }
    return new Promise((resolve) => {
      const request = indexedDB.open(this.name);

      request.onsuccess = (): void => {
        const database = request.result;
        const hasObjectStore = database.objectStoreNames.contains(objectStoreName);

        database.close();
        resolve(hasObjectStore);
      };
      request.onerror = (): void => resolve(false);
    });
  }

  public async destroy(): Promise<void> {
    this.lock();
    await yieldControl();
    indexedDB.deleteDatabase(this.name);
  }

  public async count(objectStoreName: string | undefined = undefined): Promise<number> {
    const database = await this.open(objectStoreName ?? this.defaultObjectStoreName);
    const transaction = database.transaction(objectStoreName ?? this.defaultObjectStoreName, "readonly");
    const objectStore = transaction.objectStore(objectStoreName ?? this.defaultObjectStoreName);
    return new Promise((resolve, reject) => {
      const request = objectStore.count();

      request.onsuccess = (): void => {
        database.close();
        resolve(request.result);
      };
      request.onerror = (): void => {
        database.close();
        reject(request.error);
      };
    });
  }

  private updateRecord(index: IDBIndex, record: V, objectStore: IDBObjectStore): void {
    index.getKey(record.id).onsuccess = (indexEvent): void => {
      const target = indexEvent.target as IDBRequest<IDBValidKey | undefined>;

      this.putRecord(objectStore, record, target.result);
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

      request.onsuccess = (): void => {
        const database = request.result;

        if (!database.objectStoreNames.contains(objectStoreName)) {
          database.close();
          this.version += 1;
          this.open(objectStoreName).then(resolve, reject);
          return;
        }

        resolve(database);
      };
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

      getAllRequest.onsuccess = (): void => {
        database.close();
        resolve(getAllRequest.result.reverse());
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
