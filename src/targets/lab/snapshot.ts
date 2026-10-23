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

function promised<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = (): void => resolve(request.result);
    request.onerror = (): void => reject(request.error);
  });
}

export async function listDatabaseNames(): Promise<Set<string | undefined>> {
  return new Set((await indexedDB.databases()).map(database => database.name));
}

export async function deleteDatabases(names: readonly string[]): Promise<void> {
  await Promise.all(names.map(name => promised(indexedDB.deleteDatabase(name))));
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

export async function writeLegacySnapshot(snapshot: unknown, from: LegacyDatabaseNames, to: LegacyDatabaseNames): Promise<void> {
  if (!Array.isArray(snapshot)) {
    throw new Error("A legacy snapshot is a list of database backups");
  }
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
