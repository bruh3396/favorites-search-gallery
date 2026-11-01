import { LAB_NAMESPACE } from "@/targets/lab/databases";

interface DatabaseBackup {
  readonly database: string;
  readonly version: number;
  readonly stores: Record<string, StoreBackup>;
}

interface StoreBackup {
  readonly keyPath: string | string[] | null;
  readonly autoIncrement: boolean;
  readonly rows: [IDBValidKey, unknown][];
}

const DATABASE = "favorites-search-gallery";
const LEGACY_DATABASES = ["FavoritesV2", "Posts", "TagCategories"];
const PURGE_FLAG = "fsg-lab-purge";

function promised<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = (): void => resolve(request.result);
    request.onerror = (): void => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function deleteDatabase(name: string): Promise<unknown> {
  const request = indexedDB.deleteDatabase(name);

  request.onblocked = (): void => console.error(`Deleting ${name} is blocked: close other rule34 tabs`);
  return promised(request);
}

async function readDatabase(name: string): Promise<DatabaseBackup> {
  const db = await promised(indexedDB.open(name));
  const storeNames = [...db.objectStoreNames];
  const stores = storeNames.length === 0 ? [] : await readStores(db.transaction(storeNames, "readonly"), storeNames);

  db.close();
  return { database: db.name, version: db.version, stores: Object.fromEntries(stores) };
}

function readStores(transaction: IDBTransaction, storeNames: string[]): Promise<[string, StoreBackup][]> {
  return Promise.all(storeNames.map(async storeName => {
    const store = transaction.objectStore(storeName);
    const [keys, values] = await Promise.all([promised(store.getAllKeys()), promised(store.getAll())]);
    return [storeName, { keyPath: store.keyPath, autoIncrement: store.autoIncrement, rows: keys.map((key, i) => [key, values[i]]) }];
  }));
}

async function writeDatabase(databaseBackup: DatabaseBackup): Promise<void> {
  const open = indexedDB.open(databaseBackup.database, databaseBackup.version);

  open.onupgradeneeded = (): void => {
    for (const [name, { keyPath, autoIncrement: isAutoIncrement }] of Object.entries(databaseBackup.stores)) {
      open.result.createObjectStore(name, keyPath === null ? { autoIncrement: isAutoIncrement } : { keyPath, autoIncrement: isAutoIncrement });
    }
  };
  const db = await promised(open);
  const storeNames = Object.keys(databaseBackup.stores);

  if (storeNames.length > 0) {
    const transaction = db.transaction(storeNames, "readwrite");

    for (const [name, { keyPath, rows }] of Object.entries(databaseBackup.stores)) {
      const store = transaction.objectStore(name);

      for (const [key, value] of rows) {
        store.put(value, keyPath === null ? key : undefined);
      }
    }
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onabort = (): void => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
    });
  }
  db.close();
}

function deleteRealDatabases(): Promise<unknown> {
  return Promise.all([DATABASE, ...LEGACY_DATABASES].map(deleteDatabase));
}

function download(contents: unknown, fileName: string): void {
  const link = document.createElement("a");

  link.href = URL.createObjectURL(new Blob([JSON.stringify(contents)]));
  link.download = fileName;
  link.click();
}

async function pickJson<T>(): Promise<T | null> {
  const input = document.createElement("input");

  input.type = "file";
  input.accept = ".json";
  const file = await new Promise<File | undefined>(resolve => {
    input.onchange = (): void => resolve(input.files?.[0]);
    input.oncancel = (): void => resolve(undefined);
    input.click();
  });
  return file === undefined ? null : JSON.parse(await file.text()) as T;
}

export async function exportRealDatabases(): Promise<string> {
  const present = new Set((await indexedDB.databases()).map(database => database.name));
  const found = [DATABASE, ...LEGACY_DATABASES].filter(name => present.has(name));

  if (found.length === 0) {
    return "No real databases found.";
  }
  download(await Promise.all(found.map(readDatabase)), "favorites-backup.json");
  return `Exported ${found.join(", ")}.`;
}

export async function importRealDatabases(): Promise<string> {
  const picked = await pickJson<DatabaseBackup | DatabaseBackup[]>();

  if (picked === null) {
    return "Import cancelled.";
  }
  const databaseBackups = Array.isArray(picked) ? picked : [picked];

  await deleteRealDatabases();
  await Promise.all(databaseBackups.map(writeDatabase));
  return `Imported ${databaseBackups.map(databaseBackup => databaseBackup.database).join(", ")}. Open your favorites page without &lab.`;
}

export function requestPurge(): void {
  sessionStorage.setItem(PURGE_FLAG, "1");
  location.reload();
}

export async function applyPendingPurge(): Promise<void> {
  if (sessionStorage.getItem(PURGE_FLAG) === null) {
    return;
  }
  sessionStorage.removeItem(PURGE_FLAG);
  const names = (await indexedDB.databases()).flatMap(database => database.name ?? []).filter(name => name !== LAB_NAMESPACE);

  await Promise.all(names.map(deleteDatabase));
  localStorage.clear();
}
