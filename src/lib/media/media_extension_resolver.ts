import { DEFAULT_EXTENSION, extensionRegex } from "../environment/constants";
import { ImageExtension, MediaExtension, MediaExtensionMapping } from "../../types/media";
import { extensionProbeLimiter, extensionProbeQueue } from "../remote/http/rate_limiter";
import { isGif, isVideo } from "./media_type_guards";
import { CoalescingExecutor } from "../core/concurrency/coalescing_executor";
import { Database } from "../core/storage/database";
import { Favorite } from "../../types/favorite";
import { ON_FAVORITES_PAGE } from "../environment/environment";
import { Post } from "../../types/api";
import { resolveBaseImageURL } from "./media_url_resolver";

const IMAGE_EXTENSIONS: ImageExtension[] = ["jpg", "png", "jpeg"];
const DATABASE_NAME = "ImageExtensions";
const OBJECT_STORE_NAME = "extensionMappings";
const extensionMap: Map<string, ImageExtension> = new Map();
const database = new Database<MediaExtensionMapping>(DATABASE_NAME, OBJECT_STORE_NAME);
const writeScheduler = new CoalescingExecutor<MediaExtensionMapping>(100, 2000, database.update.bind(database));

async function probeExtension(url: string, extension: string): Promise<boolean> {
  const response = await fetch(url.replace(".jpg", `.${extension}`), { method: "HEAD" }).catch();
  return response.ok;
}

async function probeExtensions(item: HTMLElement | Favorite): Promise<ImageExtension | null> {
  const baseUrl = resolveBaseImageURL(item);

  for (const extension of IMAGE_EXTENSIONS) {
    if (await probeExtension(baseUrl, extension)) {
      return extension;
    }
  }
  return null;
}

async function findMediaExtension(item: HTMLElement | Favorite): Promise<ImageExtension | null> {
  await extensionProbeQueue.wait();
  return extensionProbeLimiter.run(() => probeExtensions(item));
}

function loadExtensionsIntoCache(): Promise<void> {
  return database.load().then(mappings => mappings.forEach(mapping => extensionMap.set(mapping.id, mapping.extension)));
}

function cache(id: string, extension: ImageExtension): void {
  if (extensionMap.has(id)) {
    return;
  }
  extensionMap.set(id, extension);

  if (ON_FAVORITES_PAGE) {
    writeScheduler.add({ id, extension });
  }
}

export function resolveExtension(item: HTMLElement | Favorite): Promise<MediaExtension> {
  if (isVideo(item)) {
    return Promise.resolve("mp4");
  }

  if (isGif(item)) {
    return Promise.resolve("gif");
  }
  const cached = extensionMap.get(item.id);

  if (cached !== undefined) {
    return Promise.resolve(cached);
  }
  return findMediaExtension(item).then(extension => {
    if (extension !== null) {
      cache(item.id, extension);
    }
    return extension ?? DEFAULT_EXTENSION;
  });
}

export function setExtensionFromPost(post: Post): void {
  const extension = extractExtensionFromURL(post.fileURL);

  if (extension !== null && IMAGE_EXTENSIONS.includes(extension as ImageExtension)) {
    cache(post.id, extension as ImageExtension);
  }
}

export const deleteExtensionsDatabase: () => void = () => database.delete();
export const extractExtensionFromURL = (url: string): MediaExtension | null => extensionRegex.exec(url)?.[1] as MediaExtension ?? null;
export const setupExtensions = loadExtensionsIntoCache;
