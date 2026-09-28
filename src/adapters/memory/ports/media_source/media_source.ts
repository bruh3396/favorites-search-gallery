import { Media } from "@/core/domain/media/media";
import { MediaSource } from "@/core/boundary/ports/media_source";

export class MemoryMediaSource implements MediaSource {
  public previewUrl(media: Media): Promise<string> {
    return Promise.resolve(media.locator);
  }

  public originalUrl(media: Media): Promise<string> {
    return Promise.resolve(media.locator);
  }

  public imageUrl(media: Media): Promise<string> {
    return Promise.resolve(media.locator);
  }

  public async fetchOriginal(media: Media, signal?: AbortSignal): Promise<Blob> {
    return (await fetch(media.locator, { signal })).blob();
  }

  public fetchDurationSeconds(): Promise<number> {
    return Promise.resolve(0);
  }
}
