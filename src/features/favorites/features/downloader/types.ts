import { MediaItem } from "@/types/media";
import { TagCategory } from "@/types/search";

export type FilenameCategory = Extract<TagCategory, "artist" | "character" | "copyright">;

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
  getSearchResults: () => MediaItem[];
  getTagCategory: (tagName: string) => TagCategory | undefined;
}
