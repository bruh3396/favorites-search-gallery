import { DEFAULT_EXTENSION, allImageExtensions, extensionRegex } from "@/lib/media/constants";
import { ImageExtension, MediaExtension, MediaExtensionMapping, MediaItem } from "@/types/media";
import { imageUrl, imageUrlToSampleUrl, replaceExtension, withExtension } from "@/lib/media/url";
import { isGif, isVideo } from "@/lib/media/type";
import { CoalescingExecutor } from "@/lib/async/coalescing";
import { Database } from "@/lib/storage/database";
import { ON_FAVORITES_PAGE } from "@/lib/environment";
import { Post } from "@/types/api";
import { extensionProbeLimiter } from "@/lib/remote/http/rate_limiters";
import { withTimeout } from "@/lib/async/scheduling";

const cache: Map<string, ImageExtension> = new Map();
const database = new Database<MediaExtensionMapping>("ImageExtensions", "extensionMappings");
const databaseUpdater = new CoalescingExecutor<MediaExtensionMapping>(100, 2_000, database.update.bind(database));
let warm: Promise<void> = Promise.resolve();

export const resolveSampleUrl = async(item: MediaItem): Promise<string> => imageUrlToSampleUrl(await resolveImageUrl(item));
export const resolveImageUrl = async(item: MediaItem): Promise<string> => replaceExtension(await resolveMediaUrl(item), "mp4", "jpg");
export const resolveMediaUrl = async(item: MediaItem): Promise<string> => withExtension(imageUrl(item), await resolveExtension(item));

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
  return resolveUncachedExtension(item);
}

export function cacheExtensions(ids: string[]): Promise<void> {
  warm = readMissingExtensions(ids);
  return warm;
}

export function writeExtensionFromPost(post: Post): void {
  const extension = extractExtension(post.fileURL);

  if (extension !== null && allImageExtensions.includes(extension as ImageExtension)) {
    saveExtension(post.id, extension as ImageExtension);
  }
}

async function resolveUncachedExtension(item: MediaItem): Promise<MediaExtension> {
  await withTimeout(warm, 1_000).catch(() => undefined);
  const cached = cache.get(item.id);

  if (cached !== undefined) {
    return cached;
  }
  const extension = await probeAllExtensions(item);

  if (extension !== null) {
    saveExtension(item.id, extension);
  }
  return extension ?? DEFAULT_EXTENSION;
}

async function readMissingExtensions(ids: string[]): Promise<void> {
  const missing = ids.filter(id => !cache.has(id));

  if (missing.length === 0) {
    return;
  }
  cacheMappings(await database.readMany(missing));
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

async function probeAllExtensions(item: MediaItem): Promise<ImageExtension | null> {
  const baseUrl = imageUrl(item);

  for (const extension of allImageExtensions) {
    const cached = cache.get(item.id);

    if (cached !== undefined) {
      return cached;
    }

    if (await probeExtension(baseUrl, extension)) {
      return extension;
    }
  }
  return null;
}

function probeExtension(url: string, extension: ImageExtension): Promise<boolean> {
  return extensionProbeLimiter.run(() => {
    return fetch(withExtension(url, extension), { method: "HEAD" })
    .then(response => response.ok)
    .catch(() => false);
  });
}
