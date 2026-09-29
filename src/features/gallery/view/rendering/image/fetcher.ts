import { ImageFetcher } from "@/features/gallery/types/types";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { MediaSource } from "@/core/boundary/ports/media_source";
import { ThrottleQueue } from "@/lib/async/rate_limiting";
import { loadImageBitmap } from "@/utils/browser/image";

export class GalleryImageFetcher implements ImageFetcher {
  private readonly fetchQueue = new ThrottleQueue(10);

  constructor(private readonly mediaSource: Pick<MediaSource, "resolvePreviewUrl" | "resolveImageUrl">) { }

  public fetchBitmap(request: ImageRequest): Promise<boolean> {
    return request.isHighRes ? this.fetchHighResBitmap(request) : this.fetchLowResBitmap(request);
  }

  public cancelFetch(id: string): void {
    this.fetchQueue.cancel(id);
  }

  private async fetchHighResBitmap(request: ImageRequest): Promise<boolean> {
    if (!await this.fetchQueue.wait(request.id) || request.isCancelled) {
      return false;
    }

    try {
      const url = await this.mediaSource.resolveImageUrl(request.item.media);

      request.complete(await loadImageBitmap(url, request.abortController.signal));
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return false;
      }
      throw error;
    }
  }

  private async fetchLowResBitmap(request: ImageRequest): Promise<boolean> {
    try {
      request.complete(await loadImageBitmap(await this.mediaSource.resolvePreviewUrl(request.item.media)));
      return true;
    } catch {
      return false;
    }
  }
}
