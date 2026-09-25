import { fetchFullImageBitmap, imageUrlToBitmap } from "@/lib/media/bitmap";
import { ImageFetcher } from "@/features/gallery/types/types";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { ThrottleQueue } from "@/lib/async/rate_limiting";

export class GalleryImageFetcher implements ImageFetcher {
  private readonly fetchQueue = new ThrottleQueue(10);

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
      request.complete(await fetchFullImageBitmap(request.item, request.abortController));
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
      request.complete(await imageUrlToBitmap(request.item.thumbUrl));
      return true;
    } catch {
      return false;
    }
  }
}
