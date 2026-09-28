import { Archiver, Filenamer } from "@/features/favorites/features/downloader/types/types";
import { ConcurrencyLimiter } from "@/lib/async/rate_limiting";
import { DownloaderConfig } from "@/config/downloader_config";
import { DownloaderZipWriter } from "@/features/favorites/features/downloader/model/zip_writer";
import { Media } from "@/core/domain/media/media";
import { PostMedia } from "@/core/domain/post/post";
import { extensionOfMimeType } from "@/utils/pure/mime";

interface ArchiverDependencies {
  filenamer: Filenamer;
  getTagsForIds: (ids: string[]) => Promise<Map<string, Set<string>>>;
  fetchOriginal: (media: Media, signal: AbortSignal) => Promise<Blob>;
}

export class DownloaderArchiver implements Archiver {
  private readonly filenamer: Filenamer;
  private readonly getTagsForIds: (ids: string[]) => Promise<Map<string, Set<string>>>;
  private readonly fetchOriginal: (media: Media, signal: AbortSignal) => Promise<Blob>;

  constructor({ filenamer, getTagsForIds, fetchOriginal }: ArchiverDependencies) {
    this.filenamer = filenamer;
    this.getTagsForIds = getTagsForIds;
    this.fetchOriginal = fetchOriginal;
  }

  public async archive(items: PostMedia[], signal: AbortSignal, onItemSettled: (filename: string | null) => void): Promise<Blob | null> {
    const limiter = new ConcurrencyLimiter(DownloaderConfig.concurrency);
    const zipWriter = new DownloaderZipWriter();
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

  private async addToArchive(zipWriter: DownloaderZipWriter, item: PostMedia, tags: Set<string>, signal: AbortSignal): Promise<string> {
    const blob = await this.fetchOriginal(item.media, signal);
    const filename = this.filenamer.filenameFor(item, tags, extensionOfMimeType(blob.type));

    zipWriter.add(filename, new Uint8Array(await blob.arrayBuffer()));
    return filename;
  }
}
