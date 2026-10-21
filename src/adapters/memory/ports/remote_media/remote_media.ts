import { Media } from "@/core/domain/media/media";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";

export class MemoryRemoteMedia implements RemoteMedia {
  public resolvePreviewUrl(media: Media): Promise<string> {
    return Promise.resolve(media.locator);
  }

  public resolveOriginalUrl(media: Media): Promise<string> {
    return Promise.resolve(media.locator);
  }

  public decodeStill(): Promise<ImageBitmap> {
    return Promise.resolve({ width: 1, height: 1, close: (): void => undefined } as ImageBitmap);
  }

  public loadOriginal(media: Media): Promise<HTMLImageElement> {
    const image = document.createElement("img");

    image.src = media.locator;
    return Promise.resolve(image);
  }

  public fetchOriginal(media: Media): Promise<Blob> {
    return Promise.resolve(new Blob([media.locator]));
  }

  public probeDurationSeconds(): Promise<number> {
    return Promise.resolve(0);
  }
}
