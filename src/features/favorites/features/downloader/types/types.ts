import { MediaItem } from "@/types/media";
import { Preference } from "@/lib/storage/preference";
import { TagCategory } from "@/types/search";

export type FilenameCategory = Extract<TagCategory, "artist" | "character" | "copyright">;

export type DownloaderPhase = "waiting" | "idle" | "downloading";

export type DownloaderAction = "start" | "cancel";

export interface DownloaderProgress {
  filename: string;
  currentBatch: number;
  totalBatches: number;
  successCount: number;
  failureCount: number;
  totalItems: number;
}

export interface DownloaderResult {
  successCount: number;
  failureCount: number;
  aborted: boolean;
}

export interface DownloaderDependencies {
  batchSize: Preference<number>;
  filenameFormat: Preference<number>;
  getSearchResults: () => MediaItem[];
  getTagCategory: (tagName: string) => TagCategory | undefined;
  getTagsForIds: (ids: string[]) => Promise<Map<string, Set<string>>>;
}

export interface DownloaderContext extends DownloaderDependencies {
  resolveExtension: (item: MediaItem) => Promise<string>;
  resolveMediaUrl: (item: MediaItem) => Promise<string>;
  fetch: (url: string, init: RequestInit) => Promise<Response>;
  saveBlob: (blob: Blob, filename: string) => void;
}

export interface DownloaderSettings {
  batchSize: Preference<number>;
  filenameFormat: Preference<number>;
  filenameOptions: Map<number, string>;
}

export interface DownloaderIntents {
  start: () => void;
  cancel: () => void;
}

export interface Filenamer {
  filenameFor: (item: MediaItem, tags: Set<string>, extension: string) => string;
}

export interface Archiver {
  archive: (items: MediaItem[], signal: AbortSignal, onItemSettled: (filename: string | null) => void) => Promise<Blob | null>;
}

export interface DownloaderScene {
  phase: DownloaderPhase;
  label: string;
  enabled: boolean;
}
