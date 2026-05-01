import { ImageRequest } from "../../../../type/gallery_image_request";

export type RequestStatus = "low-res" | "complete";
export type CachedRequest = {
  request: ImageRequest;
  status: RequestStatus;
};

const CACHE: Map<string, CachedRequest> = new Map();

function release(cached: CachedRequest | undefined): void {
  cached?.request.close();
  cached?.request.stop();
}

function evictStale(candidates: ImageRequest[]): void {
  const candidateIds = new Set(candidates.map(request => request.id));

  for (const [id, cached] of CACHE.entries()) {
    if (!candidateIds.has(id)) {
      release(cached);
      CACHE.delete(id);
    }
  }
}

export function sync(candidates: ImageRequest[]): ImageRequest[] {
  evictStale(candidates);
  const unseen = candidates.filter(request => !CACHE.has(request.id));

  unseen.forEach(request => register(request));
  return unseen;
}

export function register(request: ImageRequest): void {
  CACHE.set(request.id, { request, status: "low-res" });
}

export function set(request: ImageRequest, status: RequestStatus): void {
  CACHE.set(request.id, { request, status });
}

export function get(id: string): CachedRequest | undefined {
  return CACHE.get(id);
}

export function completedRequests(): ImageRequest[] {
  return [...CACHE.values()].filter(cached => cached.status === "complete").map(cached => cached.request);
}

export function clear(): void {
  [...CACHE.values()].forEach(cached => release(cached));
  CACHE.clear();
}
