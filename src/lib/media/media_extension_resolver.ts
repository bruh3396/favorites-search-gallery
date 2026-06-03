import { DEFAULT_EXTENSION, allImageExtensions, extensionRegex } from "./media_constants";
import { ImageExtension, MediaExtension, MediaExtensionMapping } from "../../types/media";
import { isGif, isVideo } from "./media_type_predicates";
import { CoalescingExecutor } from "../async/coalescing_executor";
import { Database } from "../storage/database";
import { Favorite } from "../../types/favorite";
import { ON_FAVORITES_PAGE } from "../environment";
import { Post } from "../../types/api";
import { probeAllExtensions } from "./media_extension_prober";

const DATABASE_NAME = "ImageExtensions";
const OBJECT_STORE_NAME = "extensionMappings";
const extensionCache: Map<string, ImageExtension> = new Map();
const database = new Database<MediaExtensionMapping>(DATABASE_NAME, OBJECT_STORE_NAME);
const databaseWriter = new CoalescingExecutor<MediaExtensionMapping>(100, 2_000, database.update.bind(database));

export const deleteExtensionsDatabase: () => void = () => database.destroy();
export const extractExtensionFromUrl = (url: string): MediaExtension | null => extensionRegex.exec(url)?.[1] as MediaExtension ?? null;
export const setupExtensions = loadExtensionsIntoCache;

export function resolveExtension(item: HTMLElement | Favorite): Promise<MediaExtension> {
  if (isVideo(item)) {
    return Promise.resolve("mp4");
  }

  if (isGif(item)) {
    return Promise.resolve("gif");
  }
  const cached = extensionCache.get(item.id);

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

export function setExtensionFromPost(post: Post): void {
  const extension = extractExtensionFromUrl(post.fileURL);

  if (extension !== null && allImageExtensions.includes(extension as ImageExtension)) {
    saveExtension(post.id, extension as ImageExtension);
  }
}

function saveExtension(id: string, extension: ImageExtension): void {
  if (extensionCache.has(id)) {
    return;
  }
  extensionCache.set(id, extension);

  if (ON_FAVORITES_PAGE) {
    databaseWriter.add({ id, extension });
  }
}

function loadExtensionsIntoCache(): Promise<void> {
  return database.readAll().then(mappings => mappings.forEach(mapping => extensionCache.set(mapping.id, mapping.extension)));
}
