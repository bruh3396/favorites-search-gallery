import { DO_NOTHING } from "../../../../../config/constants";
import { GallerySettings } from "../../../../../config/gallery_settings";
import { ImageRequest } from "../../../types/image_request";
import { ON_FAVORITES_PAGE } from "../../../../../lib/globals/flags";
import { ThrottledQueue } from "../../../../../components/functional/throttled_queue";
import { getImageFromThumb } from "../../../../../utils/dom/dom";

const ANIMATED_REQUEST_IDS: Set<string> = new Set();
const ALL_IMAGE_REQUESTS: Map<string, ImageRequest> = new Map();
const FETCH_QUEUE = new ThrottledQueue(25);
let onImageCreated: (request: ImageRequest) => void = DO_NOTHING;

export function setupImageCreator(creationCallback: (request: ImageRequest) => void): void {
  onImageCreated = creationCallback;
}

export function createNewImages(thumbs: HTMLElement[]): void {
  const truncatedRequests = truncateImageRequests(thumbs.map(thumb => new ImageRequest(thumb)));

  deleteOutdatedRequests(truncatedRequests);
  const newRequests = removeAlreadyStartedRequests(truncatedRequests);

  saveMultipleRequests(newRequests);
  createImages(newRequests);
}

function completeImageRequest(request: ImageRequest): void {
  if (ALL_IMAGE_REQUESTS.has(request.id) && request.isImage) {
    ALL_IMAGE_REQUESTS.set(request.id, request);
  }
  onImageCreated(request);
}

function truncateImageRequests(requests: ImageRequest[]): ImageRequest[] {
  if (ON_FAVORITES_PAGE) {
    return truncateImagesExceedingMemoryLimit(requests);
  }
  return truncateImagesOnSearchPage(requests);
}

function truncateImagesExceedingMemoryLimit(requests: ImageRequest[]): ImageRequest[] {
  const truncatedRequests = [];
  let accumulatedMegabytes = 0;
  const sizeLimit = GallerySettings.imageMegabyteLimit;
  const minimum = GallerySettings.minimumPreloadedImageCount;
  let i = 0;

  while (i < requests.length && (accumulatedMegabytes < sizeLimit || truncatedRequests.length < minimum)) {
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

function deleteOutdatedRequests(requests: ImageRequest[]): void {
  const idsToCreate = new Set(requests.map(thumb => thumb.id));

  for (const [id, request] of ALL_IMAGE_REQUESTS.entries()) {
    if (!idsToCreate.has(id)) {
      request.cancel();
      ALL_IMAGE_REQUESTS.delete(id);
    }
  }
}

function removeAlreadyStartedRequests(requests: ImageRequest[]): ImageRequest[] {
  return requests.filter(request => !ANIMATED_REQUEST_IDS.has(request.id) && !ALL_IMAGE_REQUESTS.has(request.id));
}

export async function createImages(requests: ImageRequest[]): Promise<void> {
  for (const request of requests) {
    await FETCH_QUEUE.wait();
    createImage(request);
  }
}

function createImage(request: ImageRequest): void {
  if (request.cancelled) {
    return;
  }
  saveRequest(request);
  request.start()
    .then(() => {
      completeImageRequest(request);
    })
    .catch(() => {
      // if (error instanceof ImageBitmapRequestCancelledError) {
      ALL_IMAGE_REQUESTS.delete(request.id);
      // return;
      // }
      // throw error;
    });
}

function saveMultipleRequests(requests: ImageRequest[]): void {
  for (const request of requests) {
    saveRequest(request);
  }
}

function saveRequest(request: ImageRequest): void {
  if (request.isImage) {
    ALL_IMAGE_REQUESTS.set(request.id, request);
  } else {
    ANIMATED_REQUEST_IDS.add(request.id);
  }
}

export function createLowResolutionImage(thumb: HTMLElement): void {
  const image = getImageFromThumb(thumb);

  if (image === null) {
    return;
  }
  const lowResolutionRequest = new ImageRequest(thumb, true);

  createImageBitmap(image)
    .then((imageBitmap) => {
      const originalResolutionRequest = ALL_IMAGE_REQUESTS.get(thumb.id);

      if (originalResolutionRequest === undefined || originalResolutionRequest.isIncomplete) {
        lowResolutionRequest.complete(imageBitmap);
        completeImageRequest(lowResolutionRequest);
      }
    });
}

export function clearAllImages(): void {
  for (const [id, request] of ALL_IMAGE_REQUESTS.entries()) {
    request.close();
    ALL_IMAGE_REQUESTS.delete(id);
  }
  ALL_IMAGE_REQUESTS.clear();
  clearAnimatedImages();
}

function clearAnimatedImages(): void {
  ANIMATED_REQUEST_IDS.clear();
}

export function getImageRequests(): ImageRequest[] {
  return Array.from(ALL_IMAGE_REQUESTS.values());
}
