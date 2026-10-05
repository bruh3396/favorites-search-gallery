import { TagCategory, TagCategoryMap } from "@/core/domain/tag/tag";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { Preference } from "@/lib/storage/preference";

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
  getTagCategories: (tagNames: string[]) => Promise<TagCategoryMap>;
  getTagsForIds: (ids: string[]) => Promise<Map<string, Set<string>>>;
  fetchOriginal: (media: Media, signal: AbortSignal) => Promise<Blob>;
}

export interface DownloaderContext extends DownloaderDependencies {
  saveBlob: (blob: Blob, filename: string) => void;
}

export interface DownloaderIntents {
  start: () => void;
  cancel: () => void;
}

export interface FilenameParts {
  tags: Set<string>;
  extension: string;
  tagCategories: TagCategoryMap;
}

export interface DownloadOptions {
  batchSize: number;
  signal: AbortSignal;
  onProgress: (progress: DownloaderProgress) => void;
}

export interface Filenamer {
  filenameFor: (item: MediaItem, parts: FilenameParts) => string;
}

export interface Archiver {
  archive: (items: MediaItem[], signal: AbortSignal, onItemSettled: (filename: string | null) => void) => Promise<Blob | null>;
}

export interface DownloaderScene {
  phase: DownloaderPhase;
  label: string;
  enabled: boolean;
}
