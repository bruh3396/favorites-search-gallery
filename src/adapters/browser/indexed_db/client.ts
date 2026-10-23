import { LegacyDatabaseNames, LegacyMigration, LegacyMintMedia, prepareLegacyMigration } from "@/adapters/browser/indexed_db/legacy_migration";

const VERSION = 1;

export interface IndexedDbClientConfiguration {
  readonly databaseName: string;
  readonly legacyDatabaseNames: LegacyDatabaseNames | null;
}

export const DEFAULT_INDEXED_DB_CONFIGURATION: IndexedDbClientConfiguration = {
  databaseName: "favorites-search-gallery",
  legacyDatabaseNames: { favorites: "FavoritesV2", posts: "Posts", tagCategories: "TagCategories" }
};

const SCHEMA = {
  favorites: {},
  posts: { keyPath: "id" },
  snippets: { keyPath: "name" },
  tagCategories: {}
} satisfies Record<string, IDBObjectStoreParameters>;

export type IndexedDbStoreName = keyof typeof SCHEMA;

export class IndexedDbClient {
  private connection: Promise<IDBDatabase> | undefined;

  constructor(
    private readonly configuration: IndexedDbClientConfiguration,
    private readonly mintLegacyMedia: LegacyMintMedia
  ) {}

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
    const { databaseName, legacyDatabaseNames } = this.configuration;
    const migration = await prepareLegacyMigration(databaseName, legacyDatabaseNames, this.mintLegacyMedia);
    const database = await this.openWithMigration(migration);

    migration.deleteLegacyDatabases();
    return database;
  }

  private openWithMigration(migration: LegacyMigration): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.configuration.databaseName, VERSION);

      request.onupgradeneeded = (): void => {
        createStores(request.result);
        migration.writeToNewDatabase(request.transaction!);
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
  for (const [name, parameters] of Object.entries(SCHEMA)) {
    database.createObjectStore(name, parameters);
  }
}
