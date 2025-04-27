// Utils.addStaticInitializer(Extensions.convertFromLocalStorageToIndexedDB);
// Utils.addStaticInitializer(Extensions.load);
// Utils.addStaticInitializer(Extensions.addEventListeners);

import {BatchExecutor} from "../components/functional/batch_executor";
import {Database} from "./database";
import {MediaExtension} from "../types/primitives/primitives";
import {MediaExtensionMapping} from "../types/primitives/composites";
import {ON_FAVORITES_PAGE} from "../lib/functional/flags";

const DATABASE_NAME: string = "ImageExtensions";
const OBJECT_STORE_NAME: string = "extensionMappings";
const EXTENSION_MAP: Map<string, MediaExtension> = new Map();
const DATABASE: Database<MediaExtensionMapping> = new Database(DATABASE_NAME, OBJECT_STORE_NAME);
const WRITE_SCHEDULER: BatchExecutor<MediaExtensionMapping> = new BatchExecutor(100, 2000, store);

function has(id: string): boolean {
  return EXTENSION_MAP.has(id);
}

function set(id: string, extension: MediaExtension): void {
  if (Extensions.has(id) || extension === "mp4" || extension === "gif") {
    return;
  }
  EXTENSION_MAP.set(id, extension);

  if (ON_FAVORITES_PAGE) {
    WRITE_SCHEDULER.add({
      id,
      extension
    });
  }
}

function get(id: string): MediaExtension | undefined {
  return EXTENSION_MAP.get(id);
}

function store(mappings: MediaExtensionMapping[]): void {
  DATABASE.update(mappings);
}

async function load(): Promise<void> {
  const mappings = await DATABASE.load();

  for (const mapping of mappings) {
    EXTENSION_MAP.set(mapping.id, mapping.extension);
  }
}

function convertFromLocalStorageToIndexedDB(): void {
  const extensionMappingsString = localStorage.getItem("imageExtensions");

  if (extensionMappingsString === null) {
    return;
  }
  const extensionMappings = JSON.parse(extensionMappingsString) as Record<string, 0 | 1 | 2 | 3 | 4>;
  const extensionDecodings: Record<number, MediaExtension> = {
    0: "jpg",
    1: "png",
    2: "jpeg",
    3: "gif",
    4: "mp4"
  };

  for (const [id, extensionEncoding] of Object.entries(extensionMappings)) {
    Extensions.set(id, extensionDecodings[extensionEncoding]);
  }
  localStorage.removeItem("imageExtensions");
}

export function deleteExtensionsDatabase(): void {
  DATABASE.delete();
}

export const Extensions = {
  has,
  set,
  get
};

export function setupExtensions(): void {
  convertFromLocalStorageToIndexedDB();
  load();
}
