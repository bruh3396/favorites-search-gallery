import { DO_NOTHING } from "../../../../../config/constants";
import { GallerySettings } from "../../../../../config/gallery_settings";
import { ImageRequest } from "../../../types/gallery_image_request";
import { ON_FAVORITES_PAGE } from "../../../../../lib/globals/flags";
import { ThrottledQueue } from "../../../../../components/functional/throttled_queue";
import { fetchImageBitmapFromThumb } from "../../../../../lib/media_api/media_api";
import { getImageFromThumb } from "../../../../../utils/dom/dom";

const ANIMATED_REQUEST_IDS: Set<string> = new Set();
const IMAGE_REQUESTS: Map<string, ImageRequest> = new Map();
const FETCH_QUEUE = new ThrottledQueue(25);
let onImageCreated: (request: ImageRequest) => void = DO_NOTHING;

function completeImageRequest(request: ImageRequest): void {
  if (IMAGE_REQUESTS.has(request.id) && request.isImage) {
    IMAGE_REQUESTS.set(request.id, request);
  }
  onImageCreated(request);
}

function getTruncatedImageRequests(thumbs: HTMLElement[]): ImageRequest[] {
  return truncateImageRequests(thumbs.map(thumb => new ImageRequest(thumb)));
}

function truncateImageRequests(requests: ImageRequest[]): ImageRequest[] {
  if (ON_FAVORITES_PAGE) {
    return truncateImagesOnFavoritesPage(requests);
  }
  return truncateImagesOnSearchPage(requests);
}

function truncateImagesOnFavoritesPage(requests: ImageRequest[]): ImageRequest[] {
  return truncateImagesExceedingMemoryLimit(requests);
}

function truncateImagesExceedingMemoryLimit(requests: ImageRequest[]): ImageRequest[] {
  const truncatedRequests = [];
  let accumulatedMegabytes = 0;
  let i = 0;

  while (i < requests.length && (accumulatedMegabytes < GallerySettings.imageMegabyteLimit || truncatedRequests.length < GallerySettings.minimumPreloadedImageCount)) {
    accumulatedMegabytes += requests[i].isImage ? requests[i].megabytes : 0;
    truncatedRequests.push(requests[i]);
    i += 1;
  }
  return truncatedRequests;
}

function truncateImagesOnSearchPage(requests: ImageRequest[]): ImageRequest[] {
  return requests.slice(0, GallerySettings.searchPagePreloadedImageCount)
    .filter(request => !request.isAnimated);
}

function removeOutdatedRequestsFromCache(newRequests: ImageRequest[]): void {
  const idsToCache = new Set(newRequests.map(thumb => thumb.id));

  for (const [id, request] of IMAGE_REQUESTS.entries()) {
    if (!idsToCache.has(id)) {
      removeRequest(request);
    }
  }
}

function removeRequest(request: ImageRequest): void {
  request.close();
  request.stop();
  IMAGE_REQUESTS.delete(request.id);
}

function filterAlreadyStartedRequests(requests: ImageRequest[]): ImageRequest[] {
  return requests.filter(request => !ANIMATED_REQUEST_IDS.has(request.id) && !IMAGE_REQUESTS.has(request.id));
}

async function createImages(requests: ImageRequest[]): Promise<void> {
  for (const request of requests) {
    await FETCH_QUEUE.wait();
    createImage(request);
  }
}

async function createImage(request: ImageRequest): Promise<void> {
  if (request.cancelled) {
    return;
  }
  const bitmap = await fetchImageBitmapFromThumb(request.thumb, request.abortController)
    .catch((error: unknown): void => {
      if (!(error instanceof DOMException) || error.name !== "AbortError") {
        throw error;
      }
    });

  if (bitmap instanceof ImageBitmap) {
    request.complete(bitmap);
    completeImageRequest(request);
  }
}

function saveRequests(requests: ImageRequest[]): void {
  for (const request of requests) {
    saveRequest(request);
  }
}

function saveRequest(request: ImageRequest): void {
  if (request.isImage) {
    IMAGE_REQUESTS.set(request.id, request);
  } else {
    ANIMATED_REQUEST_IDS.add(request.id);
  }
}

export function clearAnimatedImages(): void {
  ANIMATED_REQUEST_IDS.clear();
}

export function setupGalleryImageCache(creationCallback: (request: ImageRequest) => void): void {
  onImageCreated = creationCallback;
}

export function cacheImages(thumbs: HTMLElement[]): void {
  const newRequests = getTruncatedImageRequests(thumbs);

  removeOutdatedRequestsFromCache(newRequests);
  const finalRequests = filterAlreadyStartedRequests(newRequests);

  saveRequests(finalRequests);
  createImages(finalRequests);
}

export function clear(): void {
  for (const request of IMAGE_REQUESTS.values()) {
    removeRequest(request);
  }
  IMAGE_REQUESTS.clear();
  clearAnimatedImages();
}

export function getImageRequests(): ImageRequest[] {
  return Array.from(IMAGE_REQUESTS.values());
}

export function getImageRequest(thumb: HTMLElement): ImageRequest | undefined {
  return IMAGE_REQUESTS.get(thumb.id);
}

export function createLowResolutionImage(thumb: HTMLElement): void {
  const image = getImageFromThumb(thumb);

  if (image === null || image.naturalWidth === 0 || image.naturalHeight === 0) {
    return;
  }
  const lowResolutionRequest = new ImageRequest(thumb, true);

  createImageBitmap(image)
    .then((bitmap) => {
      const originalResolutionRequest = IMAGE_REQUESTS.get(thumb.id);

      if (originalResolutionRequest === undefined || originalResolutionRequest.isIncomplete) {
        lowResolutionRequest.complete(bitmap);
        completeImageRequest(lowResolutionRequest);
      }
    });
}

export function createImageFromThumb(thumb: HTMLElement): void {
  const request = new ImageRequest(thumb);

  createImage(request);
  saveRequest(request);
}
