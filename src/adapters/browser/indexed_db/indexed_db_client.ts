import { LegacyMigration, prepareLegacyMigration } from "@/adapters/browser/indexed_db/legacy_migration";
import { IndexedDbStoreName } from "@/adapters/browser/indexed_db/indexed_db_store_name";
import { LegacyDatabaseNames } from "@/adapters/browser/indexed_db/legacy_database_names";
import { MediaMinter } from "@/core/domain/media/media_minter";

const VERSION = 1;

const STORES: Readonly<Record<IndexedDbStoreName, IDBObjectStoreParameters>> = {
  favorites: {},
  posts: { keyPath: "id" },
  snippets: { keyPath: "name" },
  tagCategories: {}
};

export interface IndexedDbClientConfiguration {
  readonly databaseName: string;
  readonly legacyDatabaseNames: LegacyDatabaseNames | null;
}

export const DEFAULT_INDEXED_DB_CLIENT_CONFIGURATION: IndexedDbClientConfiguration = {
  databaseName: "favorites-search-gallery",
  legacyDatabaseNames: { favorites: "FavoritesV2", posts: "Posts", tagCategories: "TagCategories" }
};

export class IndexedDbClient {
  private connection: Promise<IDBDatabase> | undefined;

  constructor(
    private readonly configuration: IndexedDbClientConfiguration,
    private readonly mintLegacyMedia: MediaMinter
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
    this.connection ??= this.migrateAndOpen().catch((error: unknown) => {
      this.connection = undefined;
      throw error;
    });
    return this.connection;
  }

  private async migrateAndOpen(): Promise<IDBDatabase> {
    const { databaseName, legacyDatabaseNames } = this.configuration;
    const legacyMigration = await prepareLegacyMigration(databaseName, legacyDatabaseNames, this.mintLegacyMedia);
    const database = await this.openWithMigration(legacyMigration);

    legacyMigration.deleteLegacyDatabases();
    return database;
  }

  private openWithMigration(legacyMigration: LegacyMigration): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.configuration.databaseName, VERSION);

      request.onupgradeneeded = (): void => {
        createStores(request.result);
        legacyMigration.writeToNewDatabase(request.transaction!);
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
