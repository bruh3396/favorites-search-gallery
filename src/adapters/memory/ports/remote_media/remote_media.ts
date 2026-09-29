import { Media } from "@/core/domain/media/media";
import { RemoteMedia } from "@/core/boundary/ports/remote_media";

export class MemoryRemoteMedia implements RemoteMedia {
  public resolvePreviewUrl(media: Media): Promise<string> {
    return Promise.resolve(media.locator);
  }

  public resolveOriginalUrl(media: Media): Promise<string> {
    return Promise.resolve(media.locator);
  }

  public resolveImageUrl(media: Media): Promise<string> {
    return Promise.resolve(media.locator);
  }

  public async fetchOriginal(media: Media, signal?: AbortSignal): Promise<Blob> {
    return (await fetch(media.locator, { signal })).blob();
  }

  public fetchDurationSeconds(): Promise<number> {
    return Promise.resolve(0);
  }
}
