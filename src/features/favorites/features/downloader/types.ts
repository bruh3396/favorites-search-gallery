import { MediaItem } from "@/types/media";

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

export interface DownloaderCallbacks {
  getItems: () => MediaItem[];
}
