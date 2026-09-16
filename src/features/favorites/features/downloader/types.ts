import { MediaItem } from "@/types/media";
import { Preference } from "@/lib/storage/preference";
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
  batchSize: Preference<number>;
  filenameFormat: Preference<number>;
  getSearchResults: () => MediaItem[];
  getTagCategory: (tagName: string) => TagCategory | undefined;
  getTagsForIds: (ids: string[]) => Promise<Map<string, Set<string>>>;
}
