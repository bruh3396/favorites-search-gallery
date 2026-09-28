import * as DownloaderStatus from "@/features/favorites/features/downloader/model/status";
import { DownloaderContext, DownloaderProgress, DownloaderResult } from "@/features/favorites/features/downloader/types/types";
import { DownloaderArchiver } from "@/features/favorites/features/downloader/model/archiver";
import { DownloaderBatcher } from "@/features/favorites/features/downloader/model/batcher";
import { DownloaderFilenamer } from "@/features/favorites/features/downloader/model/filenamer";
import { PostMedia } from "@/core/domain/post/post";

export class DownloaderModel {
  private readonly filenamer: DownloaderFilenamer;
  private readonly batcher: DownloaderBatcher;

  constructor({ filenameFormat, getTagCategory, getTagsForIds, fetchOriginal, saveBlob }: DownloaderContext) {
    this.filenamer = new DownloaderFilenamer({ filenameFormat, getTagCategory });
    this.batcher = new DownloaderBatcher({
      archiver: new DownloaderArchiver({ filenamer: this.filenamer, getTagsForIds, fetchOriginal }),
      saveBlob
    });
  }

  public filenameOptions(): Map<number, string> {
    return this.filenamer.options();
  }

  public download(items: PostMedia[], batchSize: number, signal: AbortSignal, onProgress: (progress: DownloaderProgress) => void): Promise<DownloaderResult> {
    return this.batcher.download(items, batchSize, signal, onProgress);
  }

  public downloadLabel(itemCount: number, batchSize: number): string {
    return DownloaderStatus.label(itemCount, batchSize);
  }

  public summarize(result: DownloaderResult): string {
    return DownloaderStatus.summary(result);
  }

  public describeProgress(progress: DownloaderProgress): string {
    return DownloaderStatus.progress(progress);
  }
}
