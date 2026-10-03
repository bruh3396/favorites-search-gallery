import { Media } from "@/core/domain/media/media";
import { RemoteMedia } from "@/core/boundary/ports/remote_media";
import { Rule34CdnClient } from "@/adapters/rule34_cdn/client/client";

export class Rule34CdnRemoteMedia implements RemoteMedia {
  constructor(private readonly rule34Cdn: Pick<Rule34CdnClient,
    "previewUrl" | "originalUrl" | "imageUrl" | "fetchFile" | "readVideoDurationSeconds">) { }

  public resolvePreviewUrl(media: Media): Promise<string> {
    return Promise.resolve(this.rule34Cdn.previewUrl(media.locator));
  }

  public resolveOriginalUrl(media: Media): Promise<string> {
    return this.rule34Cdn.originalUrl(media.locator, media.kind);
  }

  public resolveImageUrl(media: Media): Promise<string> {
    return this.rule34Cdn.imageUrl(media.locator, media.kind);
  }

  public async fetchOriginal(media: Media, signal?: AbortSignal): Promise<Blob> {
    return this.rule34Cdn.fetchFile(await this.resolveOriginalUrl(media), signal);
  }

  public async fetchDurationSeconds(media: Media): Promise<number> {
    return this.rule34Cdn.readVideoDurationSeconds(await this.resolveOriginalUrl(media));
  }
}
