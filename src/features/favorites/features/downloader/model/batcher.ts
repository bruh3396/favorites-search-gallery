import { Archiver, DownloaderProgress, DownloaderResult } from "@/features/favorites/features/downloader/types/types";
import { DownloaderConfig } from "@/config/downloader_config";
import { PostMedia } from "@/core/domain/post/post";
import { chunk } from "@/utils/pure/array";

export class DownloaderBatcher {
  private readonly archiver: Archiver;
  private readonly saveBlob: (blob: Blob, filename: string) => void;

  constructor({ archiver, saveBlob }: { archiver: Archiver; saveBlob: (blob: Blob, filename: string) => void }) {
    this.archiver = archiver;
    this.saveBlob = saveBlob;
  }

  public async download(items: PostMedia[], batchSize: number, signal: AbortSignal, onProgress: (progress: DownloaderProgress) => void): Promise<DownloaderResult> {
    const batches = chunk(items, batchSize);
    const result: DownloaderResult = { successCount: 0, failureCount: 0, aborted: false };

    for (const [batchIndex, batch] of batches.entries()) {
      if (signal.aborted) {
        break;
      }

      const blob = await this.archiver.archive(batch, signal, (filename) => {
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
        this.saveBlob(blob, batchFilename(batchIndex + 1, batches.length));
      }
    }
    result.aborted = signal.aborted;
    return result;
  }
}

function batchFilename(batch: number, batchCount: number): string {
  if (batchCount <= 1) {
    return `${DownloaderConfig.archiveName}.zip`;
  }
  return `${DownloaderConfig.archiveName}_${String(batch).padStart(String(batchCount).length, "0")}of${batchCount}.zip`;
}
