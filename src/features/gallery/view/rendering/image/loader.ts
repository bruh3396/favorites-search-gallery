import * as GalleryImageFetcher from "@/features/gallery/view/rendering/image/fetcher";
import { CachedRequest, GalleryImageCache } from "@/features/gallery/view/rendering/image/cache";
import { Environment } from "@/app/context/environment";
import { GalleryImageBudgeter } from "@/features/gallery/view/rendering/image/budgeter";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { LowResolutionImageRequest } from "@/features/gallery/types/low_resolution_image_request";
import { isImageThumb } from "@/lib/ui/thumb/media_item";

export class GalleryImageLoader {
  private readonly cache = new GalleryImageCache();
  private readonly budgeter: GalleryImageBudgeter;

  constructor(environment: Environment, private readonly onRequestCompleted: (request: ImageRequest) => void) {
    this.budgeter = new GalleryImageBudgeter(environment, () => 0);
  }

  public load(thumbs: HTMLElement[]): ImageRequest[] {
    const { accepted, rejected } = this.budgeter.partition(thumbs.filter(t => isImageThumb(t)));

    this.cache.sync(accepted).forEach(request => this.runRequest(request));
    return rejected;
  }

  public loadImmediate(thumb: HTMLElement): void {
    const request = new ImageRequest(thumb);

    this.cache.markLowRes(request);
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
        this.cache.markComplete(request);
      } else {
        this.cache.markLowRes(request);
      }
      this.onRequestCompleted(request);
    }
  }

  private async runRequest(request: ImageRequest): Promise<void> {
    if (!request.isCancelled && await GalleryImageFetcher.fetchBitmap(request)) {
      this.settleRequest(request);
    }
  }
}
