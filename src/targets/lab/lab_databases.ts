import { DEFAULT_INDEXED_DB_CONFIGURATION, IndexedDbClientConfiguration } from "@/adapters/browser/indexed_db/client";
import { LegacyDatabaseNames } from "@/adapters/browser/indexed_db/legacy_migration";

interface StoreBackup {
  readonly keyPath: string | string[] | null;
  readonly autoIncrement?: boolean;
  readonly rows: readonly (readonly [IDBValidKey, unknown])[];
}

interface DatabaseBackup {
  readonly database: string;
  readonly version: number;
  readonly stores: Readonly<Record<string, StoreBackup>>;
}

export const LAB_NAMESPACE = "fsg-lab";
export const LAB_INDEXED_DB_CONFIGURATION: IndexedDbClientConfiguration = {
  databaseName: LAB_NAMESPACE,
  legacyDatabaseNames: {
    favorites: `${LAB_NAMESPACE}-FavoritesV2`,
    posts: `${LAB_NAMESPACE}-Posts`,
    tagCategories: `${LAB_NAMESPACE}-TagCategories`
  }
};
const LAB_DATABASE_NAMES = [LAB_INDEXED_DB_CONFIGURATION.databaseName, ...Object.values(LAB_INDEXED_DB_CONFIGURATION.legacyDatabaseNames)];
const RESET_FLAG = `${LAB_NAMESPACE}-reset`;

function promised<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = (): void => resolve(request.result);
    request.onerror = (): void => reject(request.error);
  });
}

export async function hasLabData(): Promise<boolean> {
  const present = new Set((await indexedDB.databases()).map(database => database.name));
  return LAB_DATABASE_NAMES.some(name => present.has(name));
}

export function requestReset(): void {
  sessionStorage.setItem(RESET_FLAG, "1");
  location.reload();
}

export async function applyPendingReset(): Promise<void> {
  if (sessionStorage.getItem(RESET_FLAG) === null) {
    return;
  }
  sessionStorage.removeItem(RESET_FLAG);
  await Promise.all(LAB_DATABASE_NAMES.map(name => promised(indexedDB.deleteDatabase(name))));
}

export async function pickJsonFile(): Promise<unknown> {
  const input = document.createElement("input");

  input.type = "file";
  input.accept = ".json";
  const file = await new Promise<File | undefined>(resolve => {
    input.onchange = (): void => resolve(input.files?.[0]);
    input.click();
  });
  return file === undefined ? null : JSON.parse(await file.text()) as unknown;
}

export async function writeLegacySnapshot(snapshot: unknown): Promise<void> {
  if (!Array.isArray(snapshot)) {
    throw new Error("A legacy snapshot is a list of database backups");
  }
  const from = DEFAULT_INDEXED_DB_CONFIGURATION.legacyDatabaseNames;
  const to = LAB_INDEXED_DB_CONFIGURATION.legacyDatabaseNames;
  const renames = new Map(Object.keys(from).map(key => [from[key as keyof LegacyDatabaseNames], to[key as keyof LegacyDatabaseNames]]));
  const backups = (snapshot as DatabaseBackup[]).filter(backup => renames.has(backup.database));

  await Promise.all(backups.map(backup => writeBackup({ ...backup, database: renames.get(backup.database)! })));
}

async function writeBackup(backup: DatabaseBackup): Promise<void> {
  const open = indexedDB.open(backup.database, backup.version);

  open.onupgradeneeded = (): void => {
    for (const [name, store] of Object.entries(backup.stores)) {
      open.result.createObjectStore(name, { autoIncrement: store.autoIncrement ?? false, ...(store.keyPath === null ? {} : { keyPath: store.keyPath }) });
    }
  };
  const database = await promised(open);
  const storeNames = Object.keys(backup.stores);

  if (storeNames.length > 0) {
    const transaction = database.transaction(storeNames, "readwrite");

    for (const [name, { keyPath, rows }] of Object.entries(backup.stores)) {
      const store = transaction.objectStore(name);

      rows.forEach(([key, value]) => (keyPath === null ? store.put(value, key) : store.put(value)));
    }
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onabort = (): void => reject(transaction.error);
    });
  }
  database.close();
}
