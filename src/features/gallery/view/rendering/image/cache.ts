import { ImageRequest } from "@/features/gallery/types/image_request";

type ImageRequestStatus = "low-resolution" | "complete";

export type CachedRequest = {
  request: ImageRequest;
  status: ImageRequestStatus;
};

export class GalleryImageCache {
  private readonly cache: Map<string, CachedRequest> = new Map();

  constructor(private readonly cancelFetch: (id: string) => void) {}

  public sync(requests: ImageRequest[]): ImageRequest[] {
    this.evictStale(requests);
    const unseen = requests.filter(request => !this.cache.has(request.id));

    unseen.forEach(request => this.storeAsLowResolution(request));
    return unseen;
  }

  public storeAsLowResolution(request: ImageRequest): void {
    this.store(request, "low-resolution");
  }

  public storeAsComplete(request: ImageRequest): void {
    this.store(request, "complete");
  }

  public get(id: string): CachedRequest | undefined {
    return this.cache.get(id);
  }

  public completedRequests(): ImageRequest[] {
    return [...this.cache.values()].filter(cached => cached.status === "complete").map(cached => cached.request);
  }

  private evictStale(currentRequests: ImageRequest[]): void {
    const currentIds = new Set(currentRequests.map(request => request.id));

    for (const [id, cached] of this.cache.entries()) {
      if (!currentIds.has(id)) {
        this.release(cached);
        this.cache.delete(id);
      }
    }
  }

  private store(request: ImageRequest, status: ImageRequestStatus): void {
    this.cache.set(request.id, { request, status });
  }

  private release(cached: CachedRequest): void {
    this.cancelFetch(cached.request.id);
    cached.request.dispose();
    cached.request.cancel();
  }
}
