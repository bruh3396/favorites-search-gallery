import { Media, MediaKind } from "@/core/domain/media/media";
import { fileUrl, previewUrl } from "@/adapters/rule34_cdn/client/addresses";
import { mintMedia, readLocator } from "@/adapters/rule34_cdn/client/locator";
import { Rule34CdnExtensionProber } from "@/adapters/rule34_cdn/client/extension_prober";
import { Rule34CdnFileExtension } from "@/adapters/rule34_cdn/client/extension";
import { Rule34CdnVideoDurationReader } from "@/adapters/rule34_cdn/client/video_duration";
import { Scheduler } from "@/core/boundary/ports/scheduler";

export interface Rule34CdnClientDependencies {
  fetch: (url: string, init?: RequestInit) => Promise<Response>;
  scheduler: Scheduler;
}

const KIND_EXTENSIONS: Record<MediaKind, Rule34CdnFileExtension | null> = { image: null, video: "mp4", gif: "gif" };

export class Rule34CdnClient {
  private readonly extensionProber: Rule34CdnExtensionProber;
  private readonly videoDurationReader: Rule34CdnVideoDurationReader;

  constructor(private readonly dependencies: Rule34CdnClientDependencies) {
    this.extensionProber = new Rule34CdnExtensionProber(dependencies);
    this.videoDurationReader = new Rule34CdnVideoDurationReader(dependencies);
  }

  public mintMedia(file: { url: string; tags: string }): Media | null {
    return mintMedia(file);
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
    const response = await this.dependencies.fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`${url} answered ${response.status}`);
    }
    return response.blob();
  }

  public readVideoDurationSeconds(url: string): Promise<number> {
    return this.videoDurationReader.readSeconds(url);
  }

  private extension(locator: string, kind: MediaKind): Promise<Rule34CdnFileExtension> {
    const known = readLocator(locator).extension ?? KIND_EXTENSIONS[kind];
    return Promise.resolve(known ?? this.extensionProber.probe(locator));
  }
}
