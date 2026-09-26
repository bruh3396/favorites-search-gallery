import { Archiver, Filenamer } from "@/features/favorites/features/downloader/types";
import { ConcurrencyLimiter } from "@/lib/async/rate_limiting";
import { DownloaderConfig } from "@/config/downloader_config";
import { MediaItem } from "@/types/media";
import { ZipWriter } from "@/features/favorites/features/downloader/zip_writer";

interface ArchiverDependencies {
  filenamer: Filenamer;
  getTagsForIds: (ids: string[]) => Promise<Map<string, Set<string>>>;
  resolveExtension: (item: MediaItem) => Promise<string>;
  resolveMediaUrl: (item: MediaItem) => Promise<string>;
  fetch: (url: string, init: RequestInit) => Promise<Response>;
}

export class FavoritesArchiver implements Archiver {
  private readonly filenamer: Filenamer;
  private readonly getTagsForIds: (ids: string[]) => Promise<Map<string, Set<string>>>;
  private readonly resolveExtension: (item: MediaItem) => Promise<string>;
  private readonly resolveMediaUrl: (item: MediaItem) => Promise<string>;
  private readonly fetch: (url: string, init: RequestInit) => Promise<Response>;

  constructor({ filenamer, getTagsForIds, resolveExtension, resolveMediaUrl, fetch }: ArchiverDependencies) {
    this.filenamer = filenamer;
    this.getTagsForIds = getTagsForIds;
    this.resolveExtension = resolveExtension;
    this.resolveMediaUrl = resolveMediaUrl;
    this.fetch = fetch;
  }

  public async archive(items: MediaItem[], signal: AbortSignal, onItemSettled: (filename: string | null) => void): Promise<Blob | null> {
    const limiter = new ConcurrencyLimiter(DownloaderConfig.concurrency);
    const zipWriter = new ZipWriter();
    const tagsById = await this.getTagsForIds(items.map(item => item.id));

    await limiter.runAll(items, async(item) => {
      if (signal.aborted) {
        return;
      }

      try {
        onItemSettled(await this.addToArchive(zipWriter, item, tagsById.get(item.id) ?? new Set(), signal));
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

  private async addToArchive(zipWriter: ZipWriter, item: MediaItem, tags: Set<string>, signal: AbortSignal): Promise<string> {
    const extension = await this.resolveExtension(item);
    const url = await this.resolveMediaUrl(item);
    const response = await this.fetch(url, { signal });
    const filename = this.filenamer.filenameFor(item, tags, extension);

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    zipWriter.add(filename, new Uint8Array(await response.arrayBuffer()));
    return filename;
  }
}
