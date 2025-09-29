import * as API from "../api/api";
import { isGif, isVideo } from "../../utils/content/content_type";
import { BatchExecutor } from "../components/batch_executor";
import { Database } from "../components/database";
import { EXTENSION_REGEX } from "../../utils/content/image_url";
import { Favorite } from "../../types/interfaces/interfaces";
import { GeneralSettings } from "../../config/general_settings";
import { MediaExtension } from "../../types/primitives/primitives";
import { MediaExtensionMapping } from "../../types/primitives/composites";
import { ON_FAVORITES_PAGE } from "./flags/intrinsic_flags";
import { Post } from "../../types/api/api_types";
import { PromiseTimeoutError } from "../../types/primitives/errors";
import { ThrottledQueue } from "../components/throttled_queue";
import { getOriginalImageURLWithJPGExtension } from "../api/media_api";
import { withTimeout } from "../../utils/misc/async";

const DATABASE_NAME: string = "ImageExtensions";
const OBJECT_STORE_NAME: string = "extensionMappings";
const EXTENSION_MAP: Map<string, MediaExtension> = new Map();
const DATABASE: Database<MediaExtensionMapping> = new Database(DATABASE_NAME, OBJECT_STORE_NAME);
const DATABASE_WRITE_SCHEDULER: BatchExecutor<MediaExtensionMapping> = new BatchExecutor(100, 2000, DATABASE.update.bind(DATABASE));
const EXTENSIONS: MediaExtension[] = ["jpg", "png", "jpeg"];
const BRUTE_FORCE_EXTENSION_QUEUE = new ThrottledQueue(40);

async function loadExtensions(): Promise<void> {
  for (const mapping of await DATABASE.load()) {
    EXTENSION_MAP.set(mapping.id, mapping.extension);
  }
}

function transferExtensionsFromLocalStorageToIndexedDB(): void {
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
    const extension = extensionDecodings[extensionEncoding];

    if (extension !== undefined) {
      set(id, extensionDecodings[extensionEncoding]);
    }
  }
  localStorage.removeItem("imageExtensions");
}

function getExtensionFromPost(post: Post): MediaExtension | null {
  return getExtensionFromURL(post.fileURL);
}

export function getExtensionFromURL(url: string): MediaExtension | null {
  const match = EXTENSION_REGEX.exec(url);
  return match === null ? null : match[1] as MediaExtension;
}

export function has(id: string): boolean {
  return EXTENSION_MAP.has(id);
}

export function get(id: string): MediaExtension | undefined {
  return EXTENSION_MAP.get(id);
}

export function set(id: string, extension: MediaExtension): void {
  if (has(id) || extension === "mp4" || extension === "gif") {
    return;
  }
  EXTENSION_MAP.set(id, extension);

  if (ON_FAVORITES_PAGE) {
    DATABASE_WRITE_SCHEDULER.add({ id, extension });
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
    .catch((error) => {
      if (error instanceof PromiseTimeoutError) {
        return tryAllPossibleExtensions(item);
      }
      throw error;
    });
}

async function tryAllPossibleExtensions(item: HTMLElement | Favorite): Promise<MediaExtension> {
  const baseURL = getOriginalImageURLWithJPGExtension(item);

  for (const extension of EXTENSIONS) {
    const testURL = baseURL.replace(".jpg", `.${extension}`);

    await BRUTE_FORCE_EXTENSION_QUEUE.wait();
    const response = await fetch(testURL);

    if (response.ok) {
      set(item.id, extension);
      return extension;
    }
  }
  return "jpg";
}

export async function getExtensionFromId(id: string): Promise<MediaExtension> {
  if (has(id)) {
    return get(id) as MediaExtension;
  }
  const post = await API.fetchPostFromAPISafe(id);
  const extension = getExtensionFromPost(post);

  if (extension !== null) {
    set(id, extension);
    return extension;
  }
  return "jpg";
}

export function setExtensionFromPost(post: Post): void {
  const extension = getExtensionFromPost(post);

  if (extension !== null) {
    set(post.id, extension);
  }
}

export function deleteExtensionsDatabase(): void {
  DATABASE.delete();
}

export function setupExtensions(): void {
  transferExtensionsFromLocalStorageToIndexedDB();
  loadExtensions();
}
