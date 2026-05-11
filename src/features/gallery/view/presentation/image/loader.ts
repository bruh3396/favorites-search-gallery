import * as GalleryImageCache from "./cache";
import { GalleryConfig } from "../../../../../config/gallery_config";
import { ImageRequest } from "../../../types/image_request";
import { LowResolutionImageRequest } from "../../../types/low_resolution_image_request";
import { ON_FAVORITES_PAGE } from "../../../../../lib/environment/environment";
import { doNothing } from "../../../../../lib/environment/constants";
import { fetchBitmap } from "./fetcher";
import { isImage } from "../../../../../lib/media/media_type_guards";
export { get, completedRequests, clear } from "./cache";

let onComplete: (request: ImageRequest) => void = doNothing;

export function setCompletionCallback(completionCallback: (request: ImageRequest) => void): void {
  onComplete = completionCallback;
}

function onBitmapLoaded(request: ImageRequest): void {
  const cached = GalleryImageCache.get(request.id);

  if (cached?.status !== "complete") {
    GalleryImageCache.set(request, request.isHighRes ? "complete" : "low-res");
    onComplete(request);
  }
 }

function exceededPreloadBudget(megabytes: number, acceptedCount: number): boolean {
  return megabytes >= GalleryConfig.imageMegabyteLimit && acceptedCount >= GalleryConfig.minimumPreloadedImageCount;
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
  return requests.slice(0, GalleryConfig.searchPagePreloadedImageCount);
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
  GalleryImageCache.sync(buildPreloadRequests(thumbs)).forEach(request => fetchRequest(request));
}

export function loadImmediate(thumb: HTMLElement): void {
  const request = new ImageRequest(thumb);

  GalleryImageCache.register(request);
  fetchRequest(new LowResolutionImageRequest(request));
  fetchRequest(request);
}
