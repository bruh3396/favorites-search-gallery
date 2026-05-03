import * as PostAPI from "../server/fetch/post_fetcher";
import { DEFAULT_EXTENSION, extensionRegex } from "../environment/constants";
import { MediaExtension, MediaExtensionMapping } from "../../types/media";
import { isGif, isVideo } from "./media_type_guards";
import { CoalescingExecutor } from "../core/concurrency/coalescing_executor";
import { Database } from "../core/storage/database";
import { Favorite } from "../../types/favorite";
import { GeneralSettings } from "../../config/general_settings";
import { ON_FAVORITES_PAGE } from "../environment/environment";
import { Post } from "../../types/post";
import { PromiseTimeoutError } from "../../types/errors";
import { findMediaExtension } from "../server/fetch/media_extension_finder";
import { withTimeout } from "../core/scheduling/promise";

const DATABASE_NAME = "ImageExtensions";
const OBJECT_STORE_NAME = "extensionMappings";
const extensionMap: Map<string, MediaExtension> = new Map();
const database = new Database<MediaExtensionMapping>(DATABASE_NAME, OBJECT_STORE_NAME);
const writeScheduler = new CoalescingExecutor<MediaExtensionMapping>(100, 2000, database.update.bind(database));
const extractExtensionFromPost: (post: Post) => MediaExtension | null = (post) => extractExtensionFromURL(post.fileURL);
const isCacheable: (extension: MediaExtension) => boolean = (extension) => extension !== "mp4" && extension !== "gif";
const getCached: (id: string) => MediaExtension | undefined = (id) => extensionMap.get(id);
const isCached: (id: string) => boolean = (id) => extensionMap.has(id);

function loadExtensionsIntoCache(): Promise<void> {
  return database.load().then(mappings => mappings.forEach(mapping => extensionMap.set(mapping.id, mapping.extension)));
}

function cache(id: string, extension: MediaExtension | null): MediaExtension | null {
  if (extension === null || isCached(id) || !isCacheable(extension)) {
    return extension;
  }
  extensionMap.set(id, extension);

  if (ON_FAVORITES_PAGE) {
    writeScheduler.add({ id, extension });
  }
  return extension;
}

function fetchExtension(id: string): Promise<MediaExtension> {
  return PostAPI.fetchPostFromAPISafe(id).then(extractExtensionFromPost).then(extension => cache(id, extension) ?? DEFAULT_EXTENSION);
}

function fetchExtensionWithFallback(item: HTMLElement | Favorite): Promise<MediaExtension> {
  return withTimeout(fetchExtension(item.id), GeneralSettings.apiTimeout)
    .catch((error) => {
      if (!(error instanceof PromiseTimeoutError)) {
        throw error;
      }
      return findMediaExtension(item).then(extension => cache(item.id, extension) ?? DEFAULT_EXTENSION);
    });
}

export function resolveExtension(item: HTMLElement | Favorite): Promise<MediaExtension> {
  if (isVideo(item)) {
    return Promise.resolve("mp4");
  }

  if (isGif(item)) {
    return Promise.resolve("gif");
  }
  return isCached(item.id) ? Promise.resolve(getCached(item.id)!) : fetchExtensionWithFallback(item);
}

export const setExtensionFromPost = (post: Post): MediaExtension | null => cache(post.id, extractExtensionFromPost(post));
export const deleteExtensionsDatabase: () => void = () => database.delete();
export const extractExtensionFromURL = (url: string): MediaExtension | null => extensionRegex.exec(url)?.[1] as MediaExtension ?? null;
export const setupExtensions = loadExtensionsIntoCache;
