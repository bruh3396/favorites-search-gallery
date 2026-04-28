import { DO_NOTHING } from "../../../../../../lib/environment/constants";
import { GallerySettings } from "../../../../../../config/gallery_settings";
import { ImageRequest } from "../../../../types/gallery_image_request";
import { LowResolutionImageRequest } from "../../../../types/gallery_low_resolution_image_request";
import { ON_FAVORITES_PAGE } from "../../../../../../lib/environment/environment";
import { fetchBitmap } from "./gallery_image_fetcher";
import { isImage } from "../../../../../../lib/media_resolver";

type RequestStatus = "pending" | "low-res" | "complete";
type CachedRequest = {
  request: ImageRequest;
  status: RequestStatus;
};

const CACHE: Map<string, CachedRequest> = new Map();
let onRequestCompleted: (request: ImageRequest) => void = DO_NOTHING;

function register(request: ImageRequest): void {
  CACHE.set(request.id, { request, status: "pending" });
}

function dispose(cached: CachedRequest): void {
  cached.request.close();
  cached.request.stop();
}

function evictStale(incoming: ImageRequest[]): void {
  const incomingIds = new Set(incoming.map(r => r.id));

  for (const [id, cached] of CACHE.entries()) {
    if (!incomingIds.has(id)) {
      dispose(cached);
      CACHE.delete(cached.request.id);
    }
  }
}

function getUnseen(requests: ImageRequest[]): ImageRequest[] {
  return requests.filter(r => !CACHE.has(r.id));
}

function limitByMemory(requests: ImageRequest[]): ImageRequest[] {
  const limited: ImageRequest[] = [];
  let accumulatedMegabytes = 0;

  for (const request of requests) {
    const belowMemoryLimit = accumulatedMegabytes < GallerySettings.imageMegabyteLimit;
    const belowMinimumCount = limited.length < GallerySettings.minimumPreloadedImageCount;

    if (!belowMemoryLimit && !belowMinimumCount) {
      break;
    }
    accumulatedMegabytes += request.megabytes;
    limited.push(request);
  }
  return limited;
}

function limitForSearchPage(requests: ImageRequest[]): ImageRequest[] {
  return requests.slice(0, GallerySettings.searchPagePreloadedImageCount);
}

function limitRequests(requests: ImageRequest[]): ImageRequest[] {
  return ON_FAVORITES_PAGE ? limitByMemory(requests) : limitForSearchPage(requests);
}

function buildRequests(thumbs: HTMLElement[]): ImageRequest[] {
  return limitRequests(thumbs.filter(t => isImage(t)).map(t => new ImageRequest(t)));
}

async function load(request: ImageRequest): Promise<void> {
  if (!request.cancelled && await fetchBitmap(request)) {
    complete(request);
  }
}

function complete(request: ImageRequest): void {
  onRequestCompleted(request);
  const cached = CACHE.get(request.id);

  if (cached === undefined || cached.status !== "complete") {
    CACHE.set(request.id, { request, status: request.isHighRes ? "complete" : "low-res" });

    if (cached !== undefined && cached.request.isLowRes) {
      cached.request.close();
    }
  }
}

export function setCompletionCallback(completionCallback: (request: ImageRequest) => void): void {
  onRequestCompleted = completionCallback;
}

export function preload(thumbs: HTMLElement[]): void {
  const incoming = buildRequests(thumbs);

  evictStale(incoming);
  getUnseen(incoming).forEach((r) => {
    register(r);
    load(r);
  });
}

export function demand(thumb: HTMLElement): void {
  const request = new ImageRequest(thumb);

  register(request);
  load(new LowResolutionImageRequest(request));
  load(request);
}

export function get(id: string): CachedRequest | undefined {
  return CACHE.get(id);
}

export function getCompletions(): ImageRequest[] {
  return [...CACHE.values()].filter(cached => cached.status === "complete").map(cached => cached.request);
}

export function clear(): void {
  [...CACHE.values()].forEach(c => dispose(c));
  CACHE.clear();
}
