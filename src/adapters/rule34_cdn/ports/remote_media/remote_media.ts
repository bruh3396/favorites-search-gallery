import { Media } from "@/core/domain/media/media";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { Rule34CdnClient } from "@/adapters/rule34_cdn/client/client";

export class Rule34CdnRemoteMedia implements RemoteMedia {
  constructor(private readonly rule34Cdn: Pick<Rule34CdnClient,
    "previewUrl" | "originalUrl" | "imageUrl" | "decodeImage" | "decodeOriginal" | "readVideoDurationSeconds">) { }

  public resolvePreviewUrl(media: Media): Promise<string> {
    return Promise.resolve(this.rule34Cdn.previewUrl(media));
  }

  public resolveOriginalUrl(media: Media): Promise<string> {
    return this.rule34Cdn.originalUrl(media);
  }

  public resolveImageUrl(media: Media): Promise<string> {
    return this.rule34Cdn.imageUrl(media);
  }

  public decodeImage(media: Media, signal?: AbortSignal): Promise<ImageBitmap> {
    return this.rule34Cdn.decodeImage(media, signal);
  }

  public decodeOriginal(media: Media, signal?: AbortSignal): Promise<ImageBitmap> {
    return this.rule34Cdn.decodeOriginal(media, signal);
  }

  public fetchDurationSeconds(media: Media): Promise<number> {
    return this.rule34Cdn.readVideoDurationSeconds(media);
  }
}
