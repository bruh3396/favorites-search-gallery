import * as GalleryImageFetcher from "@/features/gallery/view/rendering/image/fetcher";
import { ImageRequest } from "@/features/gallery/types/image_request";

type RequestStatus = "low-res" | "complete";
export type CachedRequest = {
  request: ImageRequest;
  status: RequestStatus;
};

export class GalleryImageCache {
  private readonly cache: Map<string, CachedRequest> = new Map();

  public sync(candidates: ImageRequest[]): ImageRequest[] {
    this.evictStale(candidates);
    const unseen = candidates.filter(request => !this.cache.has(request.id));

    unseen.forEach(request => this.markLowRes(request));
    return unseen;
  }

  public markLowRes(request: ImageRequest): void {
    this.mark(request, "low-res");
  }

  public markComplete(request: ImageRequest): void {
    this.mark(request, "complete");
  }

  public get(id: string): CachedRequest | undefined {
    return this.cache.get(id);
  }

  public completedRequests(): ImageRequest[] {
    return [...this.cache.values()].filter(cached => cached.status === "complete").map(cached => cached.request);
  }

  private evictStale(candidates: ImageRequest[]): void {
    const candidateIds = new Set(candidates.map(request => request.id));

    for (const [id, cached] of this.cache.entries()) {
      if (!candidateIds.has(id)) {
        this.release(cached);
        this.cache.delete(id);
      }
    }
  }

  private mark(request: ImageRequest, status: RequestStatus): void {
    this.cache.set(request.id, { request, status });
  }

  private release(cached: CachedRequest | undefined): void {
    if (cached === undefined) {
      return;
    }
    GalleryImageFetcher.cancelFetch(cached.request.id);
    cached.request.close();
    cached.request.cancel();
  }
}
