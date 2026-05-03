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

const DATABASE_NAME: string = "ImageExtensions";
const OBJECT_STORE_NAME: string = "extensionMappings";
const extensionMap: Map<string, MediaExtension> = new Map();
const database: Database<MediaExtensionMapping> = new Database(DATABASE_NAME, OBJECT_STORE_NAME);
const writeScheduler: CoalescingExecutor<MediaExtensionMapping> = new CoalescingExecutor(100, 2000, database.update.bind(database));

async function loadExtensions(): Promise<void> {
  for (const mapping of await database.load()) {
    extensionMap.set(mapping.id, mapping.extension);
  }
}

function getExtensionFromPost(post: Post): MediaExtension | null {
  return getExtensionFromURL(post.fileURL);
}

export function getExtensionFromURL(url: string): MediaExtension | null {
  const match = extensionRegex.exec(url);
  return match === null ? null : match[1] as MediaExtension;
}

export function has(id: string): boolean {
  return extensionMap.has(id);
}

export function get(id: string): MediaExtension | undefined {
  return extensionMap.get(id);
}

export function set(id: string, extension: MediaExtension): void {
  if (has(id) || extension === "mp4" || extension === "gif") {
    return;
  }
  extensionMap.set(id, extension);

  if (ON_FAVORITES_PAGE) {
    writeScheduler.add({ id, extension });
  }
}

export function getExtension(item: HTMLElement | Favorite): Promise<MediaExtension> {
  if (isVideo(item)) {
    return Promise.resolve("mp4");
  }

  if (isGif(item)) {
    return Promise.resolve("gif");
  }
  return withTimeout(getExtensionFromId(item.id), GeneralSettings.apiTimeout)
    .catch(async(error) => {
      if (error instanceof PromiseTimeoutError) {
        const extension = await findMediaExtension(item);

        if (extension !== null) {
          set(item.id, extension);
        }
        return extension ?? DEFAULT_EXTENSION;
      }
      throw error;
    });
}

export async function getExtensionFromId(id: string): Promise<MediaExtension> {
  if (has(id)) {
    return get(id) as MediaExtension;
  }
  const post = await PostAPI.fetchPostFromAPISafe(id);
  const extension = getExtensionFromPost(post);

  if (extension !== null) {
    set(id, extension);
    return extension;
  }
  return DEFAULT_EXTENSION;
}

export function setExtensionFromPost(post: Post): void {
  const extension = getExtensionFromPost(post);

  if (extension !== null) {
    set(post.id, extension);
  }
}

export function deleteExtensionsDatabase(): void {
  database.delete();
}

export function setupExtensions(): void {
  loadExtensions();
}
