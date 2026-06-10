import { DEFAULT_EXTENSION, allImageExtensions, extensionRegex } from "@/lib/media/constants";
import { ImageExtension, MediaExtension, MediaExtensionMapping } from "@/types/media";
import { isGif, isVideo } from "@/lib/media/type_predicates";
import { CoalescingExecutor } from "@/lib/async/coalescing_executor";
import { Database } from "@/lib/storage/database";
import { Favorite } from "@/types/favorite";
import { ON_FAVORITES_PAGE } from "@/lib/environment";
import { Post } from "@/types/api";
import { probeAllExtensions } from "@/lib/media/extension_prober";

const DATABASE_NAME = "ImageExtensions";
const OBJECT_STORE_NAME = "extensionMappings";
const extensionCache: Map<string, ImageExtension> = new Map();
const database = new Database<MediaExtensionMapping>(DATABASE_NAME, OBJECT_STORE_NAME);
const databaseWriter = new CoalescingExecutor<MediaExtensionMapping>(100, 2_000, database.update.bind(database));

export const destroyStore: () => void = () => database.destroy();
export const extractExtension = (url: string): MediaExtension | null => extensionRegex.exec(url)?.[1] as MediaExtension ?? null;
export const setupExtensions = (gate?: Promise<unknown>): Promise<void> => loadExtensionsIntoCache(gate);

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
  const extension = extractExtension(post.fileURL);

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
    databaseWriter.schedule({ id, extension });
  }
}

async function loadExtensionsIntoCache(gate?: Promise<unknown>): Promise<void> {
  if (!ON_FAVORITES_PAGE) {
    return;
  }
  await gate;
  (await database.readAll()).forEach(mapping => extensionCache.set(mapping.id, mapping.extension));
}
