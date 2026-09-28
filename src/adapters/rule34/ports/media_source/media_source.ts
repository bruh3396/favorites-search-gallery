import { Media } from "@/core/domain/media/media";
import { MediaSource } from "@/core/boundary/ports/media_source";
import { Rule34MediaClient } from "@/adapters/rule34/client/media/client";

export class Rule34MediaSource implements MediaSource {
  constructor(private readonly rule34: Pick<Rule34MediaClient, "previewUrl" | "originalUrl" | "imageUrl" | "fetchFile" | "readVideoDuration">) { }

  public previewUrl(media: Media): Promise<string> {
    return Promise.resolve(this.rule34.previewUrl(media.locator));
  }

  public originalUrl(media: Media): Promise<string> {
    return this.rule34.originalUrl(media.locator, media.kind);
  }

  public imageUrl(media: Media): Promise<string> {
    return this.rule34.imageUrl(media.locator, media.kind);
  }

  public async fetchOriginal(media: Media, signal?: AbortSignal): Promise<Blob> {
    return this.rule34.fetchFile(await this.originalUrl(media), signal);
  }

  public async fetchDurationSeconds(media: Media): Promise<number> {
    return this.rule34.readVideoDuration(await this.originalUrl(media));
  }
}
