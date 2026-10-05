import { Archiver, Filenamer } from "@/features/favorites/features/downloader/types/types";
import { ConcurrencyLimiter } from "@/lib/async/rate_limiting";
import { DownloaderZipWriter } from "@/features/favorites/features/downloader/model/zip_writer";
import { Media } from "@/core/domain/media/media";
import { PostMedia } from "@/core/domain/post/post";
import { TagCategoryMap } from "@/core/domain/tag/tag";
import { extensionOfMimeType } from "@/utils/pure/mime";

const CONCURRENCY = 5;

interface ArchiverDependencies {
  filenamer: Filenamer;
  getTagsForIds: (ids: string[]) => Promise<Map<string, Set<string>>>;
  getTagCategories: (tagNames: string[]) => Promise<TagCategoryMap>;
  fetchOriginal: (media: Media, signal: AbortSignal) => Promise<Blob>;
}

interface ArchiveRun {
  zipWriter: DownloaderZipWriter;
  tagsById: Map<string, Set<string>>;
  tagCategories: TagCategoryMap;
  signal: AbortSignal;
}

export class DownloaderArchiver implements Archiver {
  private readonly filenamer: Filenamer;
  private readonly getTagsForIds: (ids: string[]) => Promise<Map<string, Set<string>>>;
  private readonly getTagCategories: (tagNames: string[]) => Promise<TagCategoryMap>;
  private readonly fetchOriginal: (media: Media, signal: AbortSignal) => Promise<Blob>;

  constructor({ filenamer, getTagsForIds, getTagCategories, fetchOriginal }: ArchiverDependencies) {
    this.filenamer = filenamer;
    this.getTagsForIds = getTagsForIds;
    this.getTagCategories = getTagCategories;
    this.fetchOriginal = fetchOriginal;
  }

  public async archive(items: PostMedia[], signal: AbortSignal, onItemSettled: (filename: string | null) => void): Promise<Blob | null> {
    const limiter = new ConcurrencyLimiter(CONCURRENCY);
    const zipWriter = new DownloaderZipWriter();
    const tagsById = await this.getTagsForIds(items.map(item => item.id));
    const tagCategories = await this.getTagCategories([...new Set([...tagsById.values()].flatMap(tags => [...tags]))]);
    const run: ArchiveRun = { zipWriter, tagsById, tagCategories, signal };

    await limiter.runAll(items, async item => {
      if (signal.aborted) {
        return;
      }

      try {
        onItemSettled(await this.addToArchive(item, run));
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

  private async addToArchive(item: PostMedia, { zipWriter, tagsById, tagCategories, signal }: ArchiveRun): Promise<string> {
    const blob = await this.fetchOriginal(item.media, signal);
    const tags = tagsById.get(item.id) ?? new Set<string>();
    const filename = this.filenamer.filenameFor(item, { tags, extension: extensionOfMimeType(blob.type), tagCategories });

    zipWriter.add(filename, new Uint8Array(await blob.arrayBuffer()));
    return filename;
  }
}
