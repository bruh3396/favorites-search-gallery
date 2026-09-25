import { CachedRequest, GalleryImageCache } from "@/features/gallery/view/rendering/image/cache";
import { ImageBudgeter, ImageFetcher } from "@/features/gallery/types/types";
import { ImageRequest, LowResolutionImageRequest } from "@/features/gallery/types/image_request";
import { MediaItem } from "@/types/media";

export class GalleryImageLoader {
  private readonly cache: GalleryImageCache;

  constructor(
    private readonly fetcher: ImageFetcher,
    private readonly budgeter: ImageBudgeter,
    private readonly onRequestCompleted: (request: ImageRequest) => void
  ) {
    this.cache = new GalleryImageCache((id) => fetcher.cancelFetch(id));
  }

  public load(items: MediaItem[]): MediaItem[] {
    const { accepted, rejected } = this.budgeter.partition(items);

    this.cache.sync(accepted).forEach(request => this.runRequest(request));
    return rejected.map(request => request.item);
  }

  public loadImmediate(item: MediaItem): void {
    const request = new ImageRequest(item);

    this.cache.storeAsLowResolution(request);
    this.runRequest(new LowResolutionImageRequest(request));
    this.runRequest(request);
  }

  public get(id: string): CachedRequest | undefined {
    return this.cache.get(id);
  }

  public completedRequests(): ImageRequest[] {
    return this.cache.completedRequests();
  }

  private settleRequest(request: ImageRequest): void {
    const cached = this.cache.get(request.id);

    if (cached === undefined || request.isCancelled) {
      request.dispose();
      return;
    }

    if (cached.status !== "complete") {
      if (request.isHighRes) {
        this.cache.storeAsComplete(request);
      } else {
        this.cache.storeAsLowResolution(request);
      }
      this.onRequestCompleted(request);
    }
  }

  private async runRequest(request: ImageRequest): Promise<void> {
    if (!request.isCancelled && await this.fetcher.fetchBitmap(request)) {
      this.settleRequest(request);
    }
  }
}
