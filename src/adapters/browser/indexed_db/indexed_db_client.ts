import { IndexedDbStoreName } from "@/adapters/browser/indexed_db/indexed_db_store_name";
import { V1Storage } from "@/adapters/browser/v1_storage/v1_storage";
import { V1StorageContents } from "@/adapters/browser/v1_storage/v1_storage_contents";

const VERSION = 1;

const STORES: Readonly<Record<IndexedDbStoreName, IDBObjectStoreParameters>> = {
  favorites: {},
  posts: { keyPath: "id" },
  snippets: { keyPath: "name" },
  tagCategories: {}
};

export interface IndexedDbClientConfiguration {
  readonly databaseName: string;
}

export const DEFAULT_INDEXED_DB_CLIENT_CONFIGURATION: IndexedDbClientConfiguration = {
  databaseName: "favorites-search-gallery"
};

export class IndexedDbClient {
  private connection: Promise<IDBDatabase> | undefined;

  constructor(
    private readonly configuration: IndexedDbClientConfiguration,
    private readonly v1Storage?: Pick<V1Storage, "read" | "delete">
  ) {}

  public async runTransaction<T>(
    indexedDbStoreName: IndexedDbStoreName,
    mode: IDBTransactionMode,
    issueRequests: (store: IDBObjectStore) => T
  ): Promise<T> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(indexedDbStoreName, mode);
      const result = issueRequests(transaction.objectStore(indexedDbStoreName));

      transaction.oncomplete = (): void => resolve(result);
      transaction.onabort = (): void => reject(transaction.error);
    });
  }

  private open(): Promise<IDBDatabase> {
    this.connection ??= this.connect().catch((error: unknown) => {
      this.connection = undefined;
      throw error;
    });
    return this.connection;
  }

  private async connect(): Promise<IDBDatabase> {
    const v1StorageContents = await this.v1Storage?.read() ?? null;
    const database = await this.openDatabase(v1StorageContents);

    await this.v1Storage?.delete();
    return database;
  }

  private openDatabase(v1StorageContents: V1StorageContents | null): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.configuration.databaseName, VERSION);

      request.onupgradeneeded = (): void => {
        createStores(request.result);

        if (v1StorageContents !== null) {
          addV1StorageContents(request.transaction!, v1StorageContents);
        }
      };
      request.onsuccess = (): void => {
        request.result.onversionchange = (): void => {
          request.result.close();
          this.connection = undefined;
        };
        resolve(request.result);
      };
      request.onerror = (): void => reject(request.error);
    });
  }
}

function createStores(database: IDBDatabase): void {
  for (const [name, parameters] of Object.entries(STORES)) {
    database.createObjectStore(name, parameters);
  }
}

function addV1StorageContents(transaction: IDBTransaction, { posts, favoriteIdsByOwnerId, tagCategoryByTagName, snippets }: V1StorageContents): void {
  posts.forEach(post => addIfAbsent(transaction.objectStore("posts"), post));
  favoriteIdsByOwnerId.forEach((favoriteIds, ownerId) => addIfAbsent(transaction.objectStore("favorites"), favoriteIds, ownerId));
  tagCategoryByTagName.forEach((tagCategory, tagName) => addIfAbsent(transaction.objectStore("tagCategories"), tagCategory, tagName));
  snippets.forEach(snippet => addIfAbsent(transaction.objectStore("snippets"), snippet));
}

function addIfAbsent(store: IDBObjectStore, value: unknown, key?: IDBValidKey): void {
  store.add(value, key).onerror = (event): void => {
    event.preventDefault();
    event.stopPropagation();
  };
}
