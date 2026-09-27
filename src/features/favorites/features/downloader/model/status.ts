import { DownloaderProgress, DownloaderResult } from "@/features/favorites/features/downloader/types/types";
import { pluralSuffix } from "@/utils/pure/string";

export function label(itemCount: number, batchSize: number): string {
  if (itemCount === 0) {
    return "Download Results";
  }
  const batchCount = batchSize <= 0 ? 1 : Math.ceil(itemCount / batchSize);

  if (batchCount <= 1) {
    return `Download ${itemCount} Result${pluralSuffix(itemCount)}`;
  }
  return `Download ${itemCount} Results · ${batchCount} zips`;
}

export function summary(result: DownloaderResult): string {
  const verb = result.aborted ? "Cancelled" : "Done";
  return `${verb}: ${result.successCount} downloaded${failureClause(result.failureCount)}`;
}

export function progress(update: DownloaderProgress): string {
  const counts = `${update.successCount}/${update.totalItems}${failureClause(update.failureCount)}`;
  return update.totalBatches > 1 ? `Batch ${update.currentBatch}/${update.totalBatches} - ${counts}` : counts;
}

function failureClause(failureCount: number): string {
  return failureCount === 0 ? "" : ` (${failureCount} failed)`;
}
