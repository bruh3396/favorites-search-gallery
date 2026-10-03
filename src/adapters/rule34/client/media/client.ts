import { Media, MediaKind } from "@/core/domain/media/media";
import { Rule34Fetch, request } from "@/adapters/rule34/client/request";
import { fileUrl, previewUrl } from "@/adapters/rule34/client/media/addresses";
import { mintMedia, readLocator } from "@/adapters/rule34/client/media/locator";
import { Rule34ExtensionProber } from "@/adapters/rule34/client/media/extension_prober";
import { Rule34FileExtension } from "@/adapters/rule34/client/media/extension";
import { Rule34VideoDurationReader } from "@/adapters/rule34/client/media/video_duration";
import { Scheduler } from "@/core/boundary/ports/scheduler";

export interface Rule34MediaClientDependencies {
  fetch: Rule34Fetch;
  scheduler: Scheduler;
}

const KIND_EXTENSIONS: Record<MediaKind, Rule34FileExtension | null> = { image: null, video: "mp4", gif: "gif" };

export class Rule34MediaClient {
  private readonly extensionProber: Rule34ExtensionProber;
  private readonly videoDurationReader: Rule34VideoDurationReader;

  constructor(private readonly dependencies: Rule34MediaClientDependencies) {
    this.extensionProber = new Rule34ExtensionProber(dependencies);
    this.videoDurationReader = new Rule34VideoDurationReader(dependencies);
  }

  public mintMedia(url: string, tags: string): Media | null {
    return mintMedia(url, tags);
  }

  public previewUrl(locator: string): string {
    return previewUrl(locator);
  }

  public async originalUrl(locator: string, kind: MediaKind): Promise<string> {
    return fileUrl(locator, await this.extension(locator, kind));
  }

  public imageUrl(locator: string, kind: MediaKind): Promise<string> {
    return kind === "video" ? Promise.resolve(fileUrl(locator, "jpg")) : this.originalUrl(locator, kind);
  }

  public async fetchFile(url: string, signal?: AbortSignal): Promise<Blob> {
    return (await request(this.dependencies.fetch, url, { signal })).blob();
  }

  public readVideoDurationSeconds(url: string): Promise<number> {
    return this.videoDurationReader.readSeconds(url);
  }

  private extension(locator: string, kind: MediaKind): Promise<Rule34FileExtension> {
    const known = readLocator(locator).extension ?? KIND_EXTENSIONS[kind];
    return Promise.resolve(known ?? this.extensionProber.probe(locator));
  }
}
