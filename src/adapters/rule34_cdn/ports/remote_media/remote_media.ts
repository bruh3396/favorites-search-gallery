import { Media } from "@/core/domain/media/media";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { Rule34CdnClient } from "@/adapters/rule34_cdn/client/client";

export class Rule34CdnRemoteMedia implements RemoteMedia {
  constructor(private readonly rule34Cdn: Pick<Rule34CdnClient,
    "previewUrl" | "originalUrl" | "decodeStill" | "loadOriginal" | "fetchOriginal" | "probeDurationSeconds">) { }

  public resolvePreviewUrl(media: Media): Promise<string> {
    return Promise.resolve(this.rule34Cdn.previewUrl(media));
  }

  public resolveOriginalUrl(media: Media): Promise<string> {
    return this.rule34Cdn.originalUrl(media);
  }

  public decodeStill(media: Media, signal?: AbortSignal, width?: number): Promise<ImageBitmap> {
    return this.rule34Cdn.decodeStill(media, signal, width);
  }

  public loadOriginal(media: Media, signal?: AbortSignal): Promise<HTMLImageElement> {
    return this.rule34Cdn.loadOriginal(media, signal);
  }

  public fetchOriginal(media: Media): Promise<Blob> {
    return this.rule34Cdn.fetchOriginal(media);
  }

  public probeDurationSeconds(media: Media): Promise<number> {
    return this.rule34Cdn.probeDurationSeconds(media);
  }
}
