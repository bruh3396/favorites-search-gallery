import { Signal, computed } from "@/core/utils/reactive/signal";
import { Button } from "@/core/ui/components/button/button";
import { Confirmer } from "@/core/boundary/ports/confirmer/confirmer";
import { CorpusFile } from "@/targets/lab/storage/corpus_file";
import { FileSaver } from "@/core/boundary/ports/file_saver/file_saver";
import { IndexedDbClient } from "@/adapters/browser/indexed_db/indexed_db_client";
import { IndexedDbStoreName } from "@/adapters/browser/indexed_db/indexed_db_store_name";
import { LabCard } from "@/targets/lab/components/card/lab_card";
import { LabRow } from "@/targets/lab/components/row/lab_row";
import { Progress } from "@/core/ui/components/progress_line/progress";
import { ProgressLine } from "@/core/ui/components/progress_line/progress_line";
import { h } from "@/core/ui/h/h";

export interface StoragePanelComposerDependencies {
  confirmer: Confirmer;
  fileSaver: FileSaver;
  corpusFile: Pick<CorpusFile, "import" | "export">;
  mainIndexedDbClient: Pick<IndexedDbClient, "runTransaction">;
}

interface SaveFilePickerWindow {
  showSaveFilePicker: (options: { suggestedName: string }) => Promise<FileSystemFileHandle>;
}

interface DatabaseBackup {
  readonly database: string;
  readonly version: number;
  readonly stores: Partial<Record<IndexedDbStoreName, StoreBackup>>;
}

interface StoreBackup {
  readonly keyPath: string | string[] | null;
  readonly autoIncrement: boolean;
  readonly rows: [IDBValidKey, unknown][];
}

const CORPUS_ACCEPT = ".ndjson,.jsonl,application/x-ndjson";
const CORPUS_FILE_NAME = "fsg-lab-corpus.ndjson";
const MAIN_BACKUP_ACCEPT = ".json,application/json";
const MAIN_BACKUP_FILE_NAME = "favorites-backup.json";
const MAIN_DATABASE_NAME = "favorites-search-gallery";
const LEGACY_DATABASE_NAMES = ["FavoritesV2", "Posts", "TagCategories"];
const MAIN_STORE_NAMES: readonly IndexedDbStoreName[] = ["favorites", "posts", "snippets", "tagCategories"];
const LAB_NAMESPACE = "fsg-lab";

export function composeStoragePanel({ confirmer, fileSaver, corpusFile, mainIndexedDbClient }: StoragePanelComposerDependencies): () => HTMLElement {
  const labProgress = new Signal<Progress>("idle");
  const mainProgress = new Signal<Progress>("idle");
  const siteProgress = new Signal<Progress>("idle");
  const labBusy = computed(() => labProgress.value !== "idle");
  const mainBusy = computed(() => mainProgress.value !== "idle");
  const siteBusy = computed(() => siteProgress.value !== "idle");
  const runTask = (progress: Signal<Progress>, task: (onProgress: (fraction: number) => void) => Promise<void>): void => {
    progress.value = "indeterminate";
    void task(fraction => {
      progress.value = fraction;
    }).catch(reportError).finally(() => {
      progress.value = "idle";
    });
  };
  const importCorpus = async(): Promise<void> => {
    const file = await pickFile(CORPUS_ACCEPT);

    if (file !== null) {
      runTask(labProgress, onProgress => corpusFile.import(file, onProgress));
    }
  };
  const exportCorpus = async(): Promise<void> => {
    const writable = await openWritable(CORPUS_FILE_NAME);

    if (writable !== null) {
      runTask(labProgress, onProgress => corpusFile.export(writable, onProgress));
    }
  };
  const clearLab = (): void => {
    if (confirmer.confirm("Clear Lab data?")) {
      runTask(labProgress, clearLabData);
    }
  };
  const exportMain = async(onProgress: (fraction: number) => void): Promise<void> => {
    const storeBackups: Partial<Record<IndexedDbStoreName, StoreBackup>> = {};

    for (const [index, indexedDbStoreName] of MAIN_STORE_NAMES.entries()) {
      const { keyPath, isAutoIncrement, keysRequest, valuesRequest } = await mainIndexedDbClient.runTransaction(indexedDbStoreName, "readonly", store => ({
        keyPath: store.keyPath,
        isAutoIncrement: store.autoIncrement,
        keysRequest: store.getAllKeys(),
        valuesRequest: store.getAll()
      }));

      const rows = keysRequest.result.map((key, rowIndex): [IDBValidKey, unknown] => [key, valuesRequest.result[rowIndex]]);

      storeBackups[indexedDbStoreName] = { keyPath, autoIncrement: isAutoIncrement, rows };
      onProgress((index + 1) / MAIN_STORE_NAMES.length);
    }
    const databaseBackups: DatabaseBackup[] = [{ database: MAIN_DATABASE_NAME, version: 1, stores: storeBackups }];

    fileSaver.save(new Blob([JSON.stringify(databaseBackups)], { type: "application/json" }), MAIN_BACKUP_FILE_NAME);
  };
  const importMain = async(): Promise<void> => {
    const file = await pickFile(MAIN_BACKUP_ACCEPT);

    if (file === null || !confirmer.confirm("Replace Main data?")) {
      return;
    }
    runTask(mainProgress, async onProgress => {
      const databaseBackups = [JSON.parse(await file.text()) as DatabaseBackup | DatabaseBackup[]].flat();
      const foundDatabaseBackup = databaseBackups.find(databaseBackup => databaseBackup.database === MAIN_DATABASE_NAME);

      for (const [index, indexedDbStoreName] of MAIN_STORE_NAMES.entries()) {
        const rows = foundDatabaseBackup?.stores[indexedDbStoreName]?.rows ?? [];

        await mainIndexedDbClient.runTransaction(indexedDbStoreName, "readwrite", store => {
          store.clear();
          rows.forEach(([key, value]) => store.put(value, store.keyPath === null ? key : undefined));
        });
        onProgress((index + 1) / MAIN_STORE_NAMES.length);
      }
    });
  };
  const clearMain = (): void => {
    if (confirmer.confirm("Clear Main data?")) {
      runTask(mainProgress, () => deleteDatabases([MAIN_DATABASE_NAME, ...LEGACY_DATABASE_NAMES]));
    }
  };
  const clearSite = (): void => {
    if (confirmer.confirm("Clear Site data?")) {
      runTask(siteProgress, clearSiteData);
    }
  };
  return () => h(LabCard, {
    children: [
      h(LabRow, {
        name: "Lab",
        actionsChild: [
          h(Button, { label: "Import", disabled: labBusy, onClick: () => importCorpus().catch(reportError) }),
          h(Button, { label: "Export", disabled: labBusy, onClick: () => exportCorpus().catch(reportError) }),
          h(Button, { label: "Clear", emphasis: "destructive", disabled: labBusy, onClick: clearLab })
        ],
        progressChild: h(ProgressLine, { label: "Lab", progress: labProgress })
      }),
      h(LabRow, {
        name: "Main",
        actionsChild: [
          h(Button, { label: "Import", disabled: mainBusy, onClick: () => importMain().catch(reportError) }),
          h(Button, { label: "Export", disabled: mainBusy, onClick: () => runTask(mainProgress, exportMain) }),
          h(Button, { label: "Clear", emphasis: "destructive", disabled: mainBusy, onClick: clearMain })
        ],
        progressChild: h(ProgressLine, { label: "Main", progress: mainProgress })
      }),
      h(LabRow, {
        name: "Site",
        actionsChild: h(Button, { label: "Clear", emphasis: "destructive", disabled: siteBusy, onClick: clearSite }),
        progressChild: h(ProgressLine, { label: "Site", progress: siteProgress })
      })
    ]
  });
}

function pickFile(accept: string): Promise<File | null> {
  const input = document.createElement("input");

  input.type = "file";
  input.accept = accept;
  return new Promise(resolve => {
    input.addEventListener("change", () => resolve(input.files?.[0] ?? null), { once: true });
    input.addEventListener("cancel", () => resolve(null), { once: true });
    input.click();
  });
}

async function clearLabData(): Promise<void> {
  await deleteDatabases([LAB_NAMESPACE]);
  Object.keys(localStorage).filter(key => key.startsWith(LAB_NAMESPACE)).forEach(key => localStorage.removeItem(key));
}

async function clearSiteData(): Promise<void> {
  const databaseNames = (await indexedDB.databases()).flatMap(databaseInfo => databaseInfo.name ?? []);

  await deleteDatabases(databaseNames.filter(databaseName => databaseName !== LAB_NAMESPACE));
  localStorage.clear();
}

async function deleteDatabases(databaseNames: readonly string[]): Promise<void> {
  await Promise.all(databaseNames.map(deleteDatabase));
}

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);

    request.onblocked = (): void => alert("Close other rule34 tabs to finish clearing.");
    request.onsuccess = (): void => resolve();
    request.onerror = (): void => reject(request.error);
  });
}

async function openWritable(suggestedName: string): Promise<FileSystemWritableFileStream | null> {
  try {
    return await (await (window as unknown as SaveFilePickerWindow).showSaveFilePicker({ suggestedName })).createWritable();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return null;
    }
    throw error;
  }
}
