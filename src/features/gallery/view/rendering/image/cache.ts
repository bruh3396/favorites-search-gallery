import * as GalleryImageFetcher from "@/features/gallery/view/rendering/image/fetcher";
import { ImageRequest } from "@/features/gallery/types/image_request";

type RequestStatus = "low-res" | "complete";
type CachedRequest = {
  request: ImageRequest;
  status: RequestStatus;
};

const cache: Map<string, CachedRequest> = new Map();

// setInterval(() => {
//   const cached = [...cache.values()];

//   console.log("[image cache]", {
//     size: cache.size,
//     lowRes: cached.filter(c => c.status === "low-res").length,
//     complete: cached.filter(c => c.status === "complete").length,
//     bitmaps: cached.filter(c => c.request.bitmap !== null).length,
//     thumbs: cached.map(c => c.request.thumb),
//     megabytes: Number(cached.reduce((sum, c) => sum + c.request.megabytes, 0).toFixed(1))
//   });
// }, 500);

export function sync(candidates: ImageRequest[]): ImageRequest[] {
  evictStale(candidates);
  const unseen = candidates.filter(request => !cache.has(request.id));

  unseen.forEach(request => markLowRes(request));
  return unseen;
}

export function markLowRes(request: ImageRequest): void {
  mark(request, "low-res");
}

export function markComplete(request: ImageRequest): void {
  mark(request, "complete");
}

export function get(id: string): CachedRequest | undefined {
  return cache.get(id);
}

export function completedRequests(): ImageRequest[] {
  return [...cache.values()].filter(cached => cached.status === "complete").map(cached => cached.request);
}

function evictStale(candidates: ImageRequest[]): void {
  const candidateIds = new Set(candidates.map(request => request.id));

  for (const [id, cached] of cache.entries()) {
    if (!candidateIds.has(id)) {
      release(cached);
      cache.delete(id);
    }
  }
}

function mark(request: ImageRequest, status: RequestStatus): void {
  cache.set(request.id, { request, status });
}

function release(cached: CachedRequest | undefined): void {
  if (cached === undefined) {
    return;
  }
  GalleryImageFetcher.cancelFetch(cached.request.id);
  cached.request.close();
  cached.request.cancel();
}
