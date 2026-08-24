import * as MediaResolver from "@/lib/media/resolver";
import { ConcurrencyLimiter } from "@/lib/async/rate_limiting";
import { DownloaderConfig } from "@/config/downloader_config";
import { MediaItem } from "@/types/media";
import { ZipWriter } from "@/features/favorites/features/downloader/zip_writer";
import { filenameFor } from "@/features/favorites/features/downloader/filename_settings";

export async function archive(items: MediaItem[], signal: AbortSignal, onItemSettled: (filename: string | null) => void): Promise<Blob | null> {
  const limiter = new ConcurrencyLimiter(DownloaderConfig.concurrency);
  const zipWriter = new ZipWriter();

  await limiter.runAll(items, async(item) => {
    if (signal.aborted) {
      return;
    }

    try {
      onItemSettled(await addToArchive(zipWriter, item, signal));
    } catch (error) {
      if (signal.aborted) {
        return;
      }
      console.error(`Failed to archive post ${item.id}`, error);
      onItemSettled(null);
    }
  });

  if (signal.aborted) {
    return null;
  }
  return zipWriter.finish();
}

async function addToArchive(zipWriter: ZipWriter, item: MediaItem, signal: AbortSignal): Promise<string> {
  const extension = await MediaResolver.resolveExtension(item);
  const url = await MediaResolver.resolveMediaUrl(item);
  const response = await fetch(url, { signal });
  const filename = filenameFor(item, extension);

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  zipWriter.add(filename, new Uint8Array(await response.arrayBuffer()));
  return filename;
}
