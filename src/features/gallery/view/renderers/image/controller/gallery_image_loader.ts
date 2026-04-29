import { DO_NOTHING } from "../../../../../../lib/environment/constants";
import { GallerySettings } from "../../../../../../config/gallery_settings";
import { ImageRequest } from "../../../../types/gallery_image_request";
import { LowResolutionImageRequest } from "../../../../types/gallery_low_resolution_image_request";
import { ON_FAVORITES_PAGE } from "../../../../../../lib/environment/environment";
import { fetchBitmap } from "./gallery_image_fetcher";
import { isImage } from "../../../../../../lib/media_resolver";

type RequestStatus = "low-res" | "complete";
type CachedRequest = {
  request: ImageRequest;
  status: RequestStatus;
};

const CACHE: Map<string, CachedRequest> = new Map();
let onRequestComplete: (request: ImageRequest) => void = DO_NOTHING;

function addToCache(request: ImageRequest): void {
  CACHE.set(request.id, { request, status: "low-res" });
}

function disposeRequest(cached: CachedRequest): void {
  cached.request.close();
  cached.request.stop();
}

function evictStaleFromCache(candidates: ImageRequest[]): void {
  const candidatesIds = new Set(candidates.map(request => request.id));
  const staleIds = [...CACHE.keys()].filter(id => !candidatesIds.has(id));

  for (const id of staleIds) {
    const cached = CACHE.get(id);

    if (cached !== undefined) {
      disposeRequest(cached);
      CACHE.delete(id);
    }
  }
}

function filterUnseen(requests: ImageRequest[]): ImageRequest[] {
  return requests.filter(request => !CACHE.has(request.id));
}

function exceededPreloadBudget(megabytes: number, acceptedCount: number): boolean {
  return megabytes >= GallerySettings.imageMegabyteLimit &&
    acceptedCount >= GallerySettings.minimumPreloadedImageCount;
}

function applyMemoryLimit(requests: ImageRequest[]): ImageRequest[] {
  const accepted: ImageRequest[] = [];
  let totalMegabytes = 0;

  for (const request of requests) {
    if (exceededPreloadBudget(totalMegabytes, accepted.length)) {
      break;
    }
    totalMegabytes += request.megabytes;
    accepted.push(request);
  }
  return accepted;
}

function applySearchPageLimit(requests: ImageRequest[]): ImageRequest[] {
  return requests.slice(0, GallerySettings.searchPagePreloadedImageCount);
}

function applyLimit(requests: ImageRequest[]): ImageRequest[] {
  return ON_FAVORITES_PAGE ? applyMemoryLimit(requests) : applySearchPageLimit(requests);
}

function buildPreloadRequests(thumbs: HTMLElement[]): ImageRequest[] {
  return applyLimit(thumbs.filter(isImage).map(thumb => new ImageRequest(thumb)));
}

async function fetchRequest(request: ImageRequest): Promise<void> {
  if (!request.cancelled && await fetchBitmap(request)) {
    onBitmapLoaded(request);
  }
}

function closeLowResRequest(cached: CachedRequest | undefined): void {
  if (cached !== undefined && cached.request.isLowRes) {
    cached.request.close();
  }
}

function onBitmapLoaded(request: ImageRequest): void {
  const cached = CACHE.get(request.id);

  if (cached?.status === "complete") {
    return;
  }
  onRequestComplete(request);
  CACHE.set(request.id, { request, status: request.isHighRes ? "complete" : "low-res" });
  closeLowResRequest(cached);
}

export function setCompletionCallback(completionCallback: (request: ImageRequest) => void): void {
  onRequestComplete = completionCallback;
}

export function preload(thumbs: HTMLElement[]): void {
  const candidates = buildPreloadRequests(thumbs);

  evictStaleFromCache(candidates);
  filterUnseen(candidates).forEach((request) => {
    addToCache(request);
    fetchRequest(request);
  });
}

export function loadImmediate(thumb: HTMLElement): void {
  const request = new ImageRequest(thumb);

  addToCache(request);
  fetchRequest(new LowResolutionImageRequest(request));
  fetchRequest(request);
}

export function getCached(id: string): CachedRequest | undefined {
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

export function clearCache(): void {
  for (const cached of CACHE.values()) {
    disposeRequest(cached);
  }
  CACHE.clear();
}
