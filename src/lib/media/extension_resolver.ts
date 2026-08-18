import { DEFAULT_EXTENSION, allImageExtensions, extensionRegex } from "@/lib/media/constants";
import { ImageExtension, MediaExtension, MediaExtensionMapping, MediaItem } from "@/types/media";
import { isGif, isVideo } from "@/lib/media/type_predicates";
import { CoalescingExecutor } from "../async/coalescing";
import { Database } from "@/lib/storage/database";
import { ON_FAVORITES_PAGE } from "@/lib/environment";
import { Post } from "@/types/api";
import { probeAllExtensions } from "@/lib/media/extension_prober";

const DATABASE_NAME = "ImageExtensions";
const OBJECT_STORE_NAME = "extensionMappings";
const cache: Map<string, ImageExtension> = new Map();
const database = new Database<MediaExtensionMapping>(DATABASE_NAME, OBJECT_STORE_NAME);
const databaseUpdater = new CoalescingExecutor<MediaExtensionMapping>(100, 2_000, database.update.bind(database));
let warm: Promise<void> = Promise.resolve();

export const destroyStore: () => void = () => database.destroy();
export const extractExtension = (url: string): MediaExtension | null => extensionRegex.exec(url)?.[1] as MediaExtension ?? null;
export const setupExtensions = (gate?: Promise<unknown>): Promise<void> => cacheAllExtensions(gate);

export function resolveExtension(item: MediaItem): Promise<MediaExtension> {
  if (isVideo(item)) {
    return Promise.resolve("mp4");
  }

  if (isGif(item)) {
    return Promise.resolve("gif");
  }
  const cached = cache.get(item.id);

  if (cached !== undefined) {
    return Promise.resolve(cached);
  }
  return probeAllExtensions(item).then(extension => {
    if (extension !== null) {
      saveExtension(item.id, extension);
    }
    return extension ?? DEFAULT_EXTENSION;
  });
}

export function cacheExtensions(ids: string[]): Promise<void> {
  warm = readMissingExtensions(ids);
  return warm;
}

async function readMissingExtensions(ids: string[]): Promise<void> {
  const missing = ids.filter(id => !cache.has(id));

  if (missing.length === 0) {
    return;
  }
  cacheMappings(await database.readMany(missing));
}

export function setExtensionFromPost(post: Post): void {
  const extension = extractExtension(post.fileURL);

  if (extension !== null && allImageExtensions.includes(extension as ImageExtension)) {
    saveExtension(post.id, extension as ImageExtension);
  }
}

function saveExtension(id: string, extension: ImageExtension): void {
  if (cache.has(id)) {
    return;
  }
  cache.set(id, extension);

  if (ON_FAVORITES_PAGE) {
    databaseUpdater.schedule({ id, extension });
  }
}

async function cacheAllExtensions(gate?: Promise<unknown>): Promise<void> {
  if (ON_FAVORITES_PAGE) {
    await gate;
    await warm;
    cacheMappings(await database.readAll());
  }
}

function cacheMappings(mappings: MediaExtensionMapping[]): void {
  mappings.forEach(mapping => cache.set(mapping.id, mapping.extension));
}
