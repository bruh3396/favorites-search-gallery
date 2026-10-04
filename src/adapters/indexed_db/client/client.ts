import { LegacyMigration, prepareLegacyMigration } from "@/adapters/indexed_db/client/legacy_migration";

const DATABASE_NAME = "favorites-search-gallery";
const VERSION = 1;

const SCHEMA = {
  favorites: {},
  posts: { keyPath: "id" },
  snippets: { keyPath: "name" },
  tagCategories: {}
} satisfies Record<string, IDBObjectStoreParameters>;

export type IndexedDbStoreName = keyof typeof SCHEMA;

export class IndexedDbClient {
  private connection: Promise<IDBDatabase> | undefined;

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
    this.connection ??= this.migrateAndOpen().catch((error: unknown) => {
      this.connection = undefined;
      throw error;
    });
    return this.connection;
  }

  private async migrateAndOpen(): Promise<IDBDatabase> {
    const migration = await prepareLegacyMigration(DATABASE_NAME);
    const database = await this.openWithMigration(migration);

    migration.deleteLegacyDatabases();
    return database;
  }

  private openWithMigration(migration: LegacyMigration): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, VERSION);

      request.onupgradeneeded = (event): void => {
        createMissingStores(request.result);

        if (event.oldVersion === 0 && request.transaction !== null) {
          migration.writeToNewDatabase(request.transaction);
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

function createMissingStores(database: IDBDatabase): void {
  for (const [name, parameters] of Object.entries(SCHEMA)) {
    if (!database.objectStoreNames.contains(name)) {
      database.createObjectStore(name, parameters);
    }
  }
}
