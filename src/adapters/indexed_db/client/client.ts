const VERSION = 1;

const SCHEMA = {
  favorites: {},
  posts: { keyPath: "id" },
  tagCategories: {}
} satisfies Record<string, IDBObjectStoreParameters>;

export type StoreName = keyof typeof SCHEMA;

export class IndexedDbClient {
  private database: Promise<IDBDatabase> | undefined;

  constructor(private readonly namespace: string) { }

  public async runTransaction<T>(storeName: StoreName, mode: IDBTransactionMode, issueRequests: (store: IDBObjectStore) => T): Promise<T> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, mode);
      const result = issueRequests(transaction.objectStore(storeName));

      transaction.oncomplete = (): void => resolve(result);
      transaction.onabort = (): void => reject(transaction.error);
    });
  }

  private open(): Promise<IDBDatabase> {
    this.database ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(this.namespace, VERSION);

      request.onupgradeneeded = (): void => createMissingStores(request.result);
      request.onsuccess = (): void => {
        request.result.onversionchange = (): void => {
          request.result.close();
          this.database = undefined;
        };
        resolve(request.result);
      };
      request.onerror = (): void => {
        this.database = undefined;
        reject(request.error);
      };
    });
    return this.database;
  }
}

function createMissingStores(database: IDBDatabase): void {
  for (const [name, parameters] of Object.entries(SCHEMA)) {
    if (!database.objectStoreNames.contains(name)) {
      database.createObjectStore(name, parameters);
    }
  }
}
