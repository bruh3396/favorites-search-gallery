import * as FavoritesArchiver from "@/features/favorites/features/downloader/archiver";
import { DownloadProgress, DownloadResult } from "@/features/favorites/features/downloader/types";
import { DownloaderConfig } from "@/config/downloader_config";
import { MediaItem } from "@/types/media";
import { downloadBlob } from "@/utils/browser/download";
import { splitIntoChunks } from "@/utils/collection/array";

export async function download(items: MediaItem[], batchSize: number, signal: AbortSignal, onProgress: (progress: DownloadProgress) => void): Promise<DownloadResult> {
  const batches = splitIntoChunks(items, batchSize);
  const result: DownloadResult = { successCount: 0, failureCount: 0, aborted: false };

  for (const [batchIndex, batch] of batches.entries()) {
    if (signal.aborted) {
      break;
    }

    const blob = await FavoritesArchiver.archive(batch, signal, (filename) => {
      if (filename === null) {
        result.failureCount += 1;
      } else {
        result.successCount += 1;
      }
      onProgress({
        filename: filename ?? "",
        currentBatch: batchIndex + 1,
        totalBatches: batches.length,
        totalItems: items.length,
        successCount: result.successCount,
        failureCount: result.failureCount
      });
    });

    if (blob !== null) {
      downloadBlob(blob, batchFilename(batchIndex + 1, batches.length));
    }
  }
  result.aborted = signal.aborted;
  return result;
}

function batchFilename(batch: number, batchCount: number): string {
  if (batchCount <= 1) {
    return `${DownloaderConfig.archiveName}.zip`;
  }
  return `${DownloaderConfig.archiveName}_${String(batch).padStart(String(batchCount).length, "0")}of${batchCount}.zip`;
}
