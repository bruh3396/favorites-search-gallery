const VERSION = 1;

const SCHEMA = {
  favorites: {},
  posts: { keyPath: "id" },
  tagCategories: {}
} satisfies Record<string, IDBObjectStoreParameters>;

export type IndexedDbStoreName = keyof typeof SCHEMA;

export class IndexedDbClient {
  private connection: Promise<IDBDatabase> | undefined;

  constructor(private readonly databaseName: string) { }

  public async runTransaction<T>(
    storeName: IndexedDbStoreName,
    mode: IDBTransactionMode,
    issueRequests: (store: IDBObjectStore) => T
  ): Promise<T> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, mode);
      const result = issueRequests(transaction.objectStore(storeName));

      transaction.oncomplete = (): void => resolve(result);
      transaction.onabort = (): void => reject(transaction.error);
    });
  }

  private open(): Promise<IDBDatabase> {
    this.connection ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, VERSION);

      request.onupgradeneeded = (): void => createMissingStores(request.result);
      request.onsuccess = (): void => {
        request.result.onversionchange = (): void => {
          request.result.close();
          this.connection = undefined;
        };
        resolve(request.result);
      };
      request.onerror = (): void => {
        this.connection = undefined;
        reject(request.error);
      };
    });
    return this.connection;
  }
}

function createMissingStores(database: IDBDatabase): void {
  for (const [name, parameters] of Object.entries(SCHEMA)) {
    if (!database.objectStoreNames.contains(name)) {
      database.createObjectStore(name, parameters);
    }
  }
}
