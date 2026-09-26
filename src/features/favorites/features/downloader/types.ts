import { MediaItem } from "@/types/media";
import { Preference } from "@/lib/storage/preference";
import { TagCategory } from "@/types/search";

export type FilenameCategory = Extract<TagCategory, "artist" | "character" | "copyright">;

export type DownloadPhase = "waiting" | "idle" | "downloading";

export interface DownloadProgress {
  filename: string;
  currentBatch: number;
  totalBatches: number;
  successCount: number;
  failureCount: number;
  totalItems: number;
}

export interface DownloadResult {
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

export interface Filenamer {
  filenameFor: (item: MediaItem, tags: Set<string>, extension: string) => string;
}

export interface Archiver {
  archive: (items: MediaItem[], signal: AbortSignal, onItemSettled: (filename: string | null) => void) => Promise<Blob | null>;
}

export interface BatchDownloader {
  download: (items: MediaItem[], batchSize: number, signal: AbortSignal, onProgress: (progress: DownloadProgress) => void) => Promise<DownloadResult>;
}

export interface DownloadPanel {
  render: (phase: DownloadPhase, downloadLabel: string, downloadEnabled: boolean) => void;
  showStatus: (text: string) => void;
  showProgress: (completed: number, total: number, label: string) => void;
}
