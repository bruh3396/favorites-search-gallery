import { DEFAULT_EXTENSION, extensionRegex } from "./media_constants";
import { ImageExtension, MediaExtension, MediaExtensionMapping } from "../../types/media";
import { extensionProbeLimiter, extensionProbeQueue } from "../remote/http/rate_limiters";
import { isGif, isVideo } from "./media_type_guards";
import { CoalescingExecutor } from "../async/coalescing_executor";
import { Database } from "../storage/database";
import { Favorite } from "../../types/favorite";
import { ON_FAVORITES_PAGE } from "../environment";
import { Post } from "../../types/api";
import { baseImageUrl } from "./base_image_url";

const ALL_IMAGE_EXTENSIONS: ImageExtension[] = ["jpeg", "png", "jpg"];
const DATABASE_NAME = "ImageExtensions";
const OBJECT_STORE_NAME = "extensionMappings";
const extensionMap: Map<string, ImageExtension> = new Map();
const database = new Database<MediaExtensionMapping>(DATABASE_NAME, OBJECT_STORE_NAME);
const writeScheduler = new CoalescingExecutor<MediaExtensionMapping>(100, 2000, database.update.bind(database));

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
  const cached = extensionMap.get(item.id);

  if (cached !== undefined) {
    return Promise.resolve(cached);
  }
  return findExtension(item).then(extension => {
    if (extension !== null) {
      saveExtension(item.id, extension);
    }
    return extension ?? DEFAULT_EXTENSION;
  });
}

export function setExtensionFromPost(post: Post): void {
  const extension = extractExtensionFromUrl(post.fileURL);

  if (extension !== null && ALL_IMAGE_EXTENSIONS.includes(extension as ImageExtension)) {
    saveExtension(post.id, extension as ImageExtension);
  }
}

async function findExtension(item: HTMLElement | Favorite): Promise<ImageExtension | null> {
  await extensionProbeQueue.wait();
  return probeAllExtensions(item);
}

async function probeAllExtensions(item: HTMLElement | Favorite): Promise<ImageExtension | null> {
  const baseUrl = baseImageUrl(item);

  for (const extension of ALL_IMAGE_EXTENSIONS) {
    if (await probeExtension(baseUrl, extension)) {
      return extension;
    }
  }
  return null;
}

function probeExtension(url: string, extension: string): Promise<boolean> {
  return extensionProbeLimiter.run(async() => {
    const response = await fetch(url.replace(".jpg", `.${extension}`), { method: "HEAD" }).catch();
    return response.ok;
  });
}

function saveExtension(id: string, extension: ImageExtension): void {
  if (!extensionMap.has(id)) {
    extensionMap.set(id, extension);
    persistExtension(id, extension);
  }
}

function persistExtension(id: string, extension: ImageExtension): void {
  if (ON_FAVORITES_PAGE) {
    writeScheduler.add({ id, extension });
  }
}

function loadExtensionsIntoCache(): Promise<void> {
  return database.readAll().then(mappings => mappings.forEach(mapping => extensionMap.set(mapping.id, mapping.extension)));
}
