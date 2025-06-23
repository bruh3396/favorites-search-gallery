import * as API from "../api/api";
import { isGif, isVideo } from "../../utils/content/content_type";
import { BatchExecutor } from "../components/batch_executor";
import { Database } from "../components/database";
import { Favorite } from "../../types/interfaces/interfaces";
import { MediaExtension } from "../../types/primitives/primitives";
import { MediaExtensionMapping } from "../../types/primitives/composites";
import { ON_FAVORITES_PAGE } from "./flags/intrinsic_flags";
import { Post } from "../../types/api/api_types";

const DATABASE_NAME: string = "ImageExtensions";
const OBJECT_STORE_NAME: string = "extensionMappings";
const EXTENSION_MAP: Map<string, MediaExtension> = new Map();
const DATABASE: Database<MediaExtensionMapping> = new Database(DATABASE_NAME, OBJECT_STORE_NAME);
const DATABASE_WRITE_SCHEDULER: BatchExecutor<MediaExtensionMapping> = new BatchExecutor(100, 2000, DATABASE.update.bind(DATABASE));
const EXTENSION_REGEX = (/\.(png|jpg|jpeg|gif|mp4)/);

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

export function getExtension(thumb: HTMLElement | Favorite): Promise<MediaExtension> {
  if (isVideo(thumb)) {
    return Promise.resolve("mp4");
  }

  if (isGif(thumb)) {
    return Promise.resolve("gif");
  }
  return getExtensionFromId(thumb.id);
}

export async function getExtensionFromId(id: string): Promise<MediaExtension> {
  if (has(id)) {
    return get(id) as MediaExtension;
  }
  const post = await API.fetchPostFromAPI(id);
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
