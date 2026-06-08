import * as GalleryImageCache from "@/features/gallery/view/rendering/image/cache";
import * as GalleryImageFetcher from "@/features/gallery/view/rendering/image/fetcher";
import { GalleryConfig } from "@/config/gallery_config";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { LowResolutionImageRequest } from "@/features/gallery/types/low_resolution_image_request";
import { ON_FAVORITES_PAGE } from "@/lib/environment";
import { doNothing } from "@/utils/function";
import { isImage } from "@/lib/media/media_type_predicates";
export { get, completedRequests, clear } from "@/features/gallery/view/rendering/image/cache";

let onComplete: (request: ImageRequest) => void = doNothing;

export function setCompletionCallback(completionCallback: (request: ImageRequest) => void): void {
  onComplete = completionCallback;
}

export function preload(thumbs: HTMLElement[]): void {
  GalleryImageCache.sync(buildPreloadRequests(thumbs)).forEach(request => fetchBitmap(request));
}

export function loadImmediate(thumb: HTMLElement): void {
  const request = new ImageRequest(thumb);

  GalleryImageCache.register(request);
  fetchBitmap(new LowResolutionImageRequest(request));
  fetchBitmap(request);
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

function applyPostListLimit(requests: ImageRequest[]): ImageRequest[] {
  return requests.slice(0, GalleryConfig.postListPreloadedImageCount);
}

function applyLimit(requests: ImageRequest[]): ImageRequest[] {
  return ON_FAVORITES_PAGE ? applyMemoryLimit(requests) : applyPostListLimit(requests);
}

function buildPreloadRequests(thumbs: HTMLElement[]): ImageRequest[] {
  return applyLimit(thumbs.filter(isImage).map(thumb => new ImageRequest(thumb)));
}

async function fetchBitmap(request: ImageRequest): Promise<void> {
  if (!request.cancelled && await GalleryImageFetcher.fetchBitmap(request)) {
    onBitmapLoaded(request);
  }
}
