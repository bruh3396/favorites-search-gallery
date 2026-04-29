import { ImageRequest } from "../../../../types/gallery_image_request";

export type RequestStatus = "low-res" | "complete";
export type CachedRequest = {
  request: ImageRequest;
  status: RequestStatus;
};

const CACHE: Map<string, CachedRequest> = new Map();

export function add(request: ImageRequest): void {
  CACHE.set(request.id, { request, status: "low-res" });
}

export function update(request: ImageRequest, status: RequestStatus): void {
  CACHE.set(request.id, { request, status });
}

export function dispose(cached: CachedRequest): void {
  cached.request.close();
  cached.request.stop();
}

export function evictStale(candidates: ImageRequest[]): void {
  const candidateIds = new Set(candidates.map(request => request.id));
  const staleIds = [...CACHE.keys()].filter(id => !candidateIds.has(id));

  for (const id of staleIds) {
    const cached = CACHE.get(id);

    if (cached !== undefined) {
      dispose(cached);
      CACHE.delete(id);
    }
  }
}

export function filterUnseen(requests: ImageRequest[]): ImageRequest[] {
  return requests.filter(request => !CACHE.has(request.id));
}

export function get(id: string): CachedRequest | undefined {
  return CACHE.get(id);
}

export function completedRequests(): ImageRequest[] {
  const result: ImageRequest[] = [];

  for (const cached of CACHE.values()) {
    if (cached.status === "complete") {
      result.push(cached.request);
    }
  }
  return result;
}

export function clear(): void {
  for (const cached of CACHE.values()) {
    dispose(cached);
  }
  CACHE.clear();
}
