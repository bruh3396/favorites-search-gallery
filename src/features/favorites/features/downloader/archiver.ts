import * as ExtensionResolver from "@/lib/media/extension_resolver";
import { BlobReader, BlobWriter, ZipWriter, configure } from "@zip.js/zip.js";
import { ConcurrencyLimiter } from "@/lib/async/rate_limiting";
import { DownloaderConfig } from "@/config/downloader_config";
import { MediaItem } from "@/types/media";
import { doNothing } from "@/utils/pure/function";
import { filenameFor } from "@/features/favorites/features/downloader/filename_settings";
import { resolveMediaUrl } from "@/lib/media/url_resolver";

configure({ useWebWorkers: false });

export async function archive(items: MediaItem[], signal: AbortSignal, onItemSettled: (filename: string | null) => void): Promise<Blob | null> {
  const limiter = new ConcurrencyLimiter(DownloaderConfig.concurrency);
  const zipWriter = new ZipWriter(new BlobWriter("application/zip"));

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
    await discard(zipWriter);
    return null;
  }
  return zipWriter.close();
}

async function addToArchive(zipWriter: ZipWriter<Blob>, item: MediaItem, signal: AbortSignal): Promise<string> {
  const extension = await ExtensionResolver.resolveExtension(item);
  const url = await resolveMediaUrl(item);
  const response = await fetch(url, { signal });
  const filename = filenameFor(item, extension);

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  await zipWriter.add(filename, new BlobReader(await response.blob()), { level: 0 });
  return filename;
}

async function discard(zipWriter: ZipWriter<Blob>): Promise<void> {
  try {
    await zipWriter.close();
  } catch {
    doNothing();
  }
}
