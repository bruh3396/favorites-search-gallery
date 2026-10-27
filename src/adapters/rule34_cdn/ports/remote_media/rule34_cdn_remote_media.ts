import { Media } from "@/core/domain/media/media";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { Rule34CdnClient } from "@/adapters/rule34_cdn/client/rule34_cdn_client";

export class Rule34CdnRemoteMedia implements RemoteMedia {
  constructor(private readonly rule34CdnClient: Pick<Rule34CdnClient,
    "resolveMedia" | "previewUrl" | "originalUrl" | "decodeStill" | "loadOriginal" | "fetchOriginal" | "probeDurationSeconds">) { }

  public resolveMedia(media: Media): Promise<Media> {
    return this.rule34CdnClient.resolveMedia(media);
  }

  public resolvePreviewUrl(media: Media): string {
    return this.rule34CdnClient.previewUrl(media);
  }

  public resolveOriginalUrl(media: Media): Promise<string> {
    return this.rule34CdnClient.originalUrl(media);
  }

  public decodeStill(media: Media, signal?: AbortSignal, width?: number): Promise<ImageBitmap> {
    return this.rule34CdnClient.decodeStill(media, signal, width);
  }

  public loadOriginal(media: Media, signal?: AbortSignal): Promise<HTMLImageElement> {
    return this.rule34CdnClient.loadOriginal(media, signal);
  }

  public fetchOriginal(media: Media): Promise<Blob> {
    return this.rule34CdnClient.fetchOriginal(media);
  }

  public probeDurationSeconds(media: Media): Promise<number> {
    return this.rule34CdnClient.probeDurationSeconds(media);
  }
}
