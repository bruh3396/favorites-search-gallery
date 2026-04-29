import * as GalleryImageCache from "./gallery_image_cache";
import { DO_NOTHING } from "../../../../../../lib/environment/constants";
import { GallerySettings } from "../../../../../../config/gallery_settings";
import { ImageRequest } from "../../../../types/gallery_image_request";
import { LowResolutionImageRequest } from "../../../../types/gallery_low_resolution_image_request";
import { ON_FAVORITES_PAGE } from "../../../../../../lib/environment/environment";
import { fetchBitmap } from "./gallery_image_fetcher";
import { isImage } from "../../../../../../lib/media_resolver";

export { get, completedRequests, clear } from "./gallery_image_cache";

let onComplete: (request: ImageRequest) => void = DO_NOTHING;

export function setCompletionCallback(completionCallback: (request: ImageRequest) => void): void {
  onComplete = completionCallback;
}

function closeLowRes(request: ImageRequest): void {
  const previous = GalleryImageCache.get(request.id);

  if (previous !== undefined && previous.request.isLowRes) {
    previous.request.close();
  }
}

function onBitmapLoaded(request: ImageRequest): void {
  const cached = GalleryImageCache.get(request.id);

  if (cached?.status === "complete") {
    return;
  }
  closeLowRes(request);
  GalleryImageCache.update(request, request.isHighRes ? "complete" : "low-res");
  onComplete(request);
}

function exceededPreloadBudget(megabytes: number, acceptedCount: number): boolean {
  return megabytes >= GallerySettings.imageMegabyteLimit && acceptedCount >= GallerySettings.minimumPreloadedImageCount;
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

export function preload(thumbs: HTMLElement[]): void {
  const candidates = buildPreloadRequests(thumbs);

  GalleryImageCache.evictStale(candidates);
  GalleryImageCache.filterUnseen(candidates).forEach((request) => {
    GalleryImageCache.add(request);
    fetchRequest(request);
  });
}

export function loadImmediate(thumb: HTMLElement): void {
  const request = new ImageRequest(thumb);

  GalleryImageCache.add(request);
  fetchRequest(new LowResolutionImageRequest(request));
  fetchRequest(request);
}
