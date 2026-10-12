import { Media } from "@/core/domain/media/media";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";

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

  public decodeImage(): Promise<ImageBitmap> {
    return this.decodeOriginal();
  }

  public decodeOriginal(): Promise<ImageBitmap> {
    return Promise.resolve({ width: 1, height: 1, close: (): void => undefined } as ImageBitmap);
  }

  public fetchDurationSeconds(): Promise<number> {
    return Promise.resolve(0);
  }
}
