import { ImageRequest } from "../../../../type/gallery_image_request";
import { ThrottledQueue } from "../../../../../../lib/core/concurrency/throttled_queue";
import { fetchImageBitmapFromThumb } from "../../../../../../lib/server/fetch/bitmap_fetcher";
import { getImageFromThumb } from "../../../../../../lib/dom/thumb";
import { imageIsLoaded } from "../../../../../../utils/dom/image";

const FETCH_QUEUE = new ThrottledQueue(10);

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

async function fetchHighResBitmap(request: ImageRequest): Promise<boolean> {
  await FETCH_QUEUE.wait();

  try {
    request.complete(await fetchImageBitmapFromThumb(request.thumb, request.abortController));
    return true;
  } catch (error) {
    if (isAbortError(error)) {
      return false;
    }
    throw error;
  }
}

async function fetchLowResBitmap(request: ImageRequest): Promise<boolean> {
  const image = getImageFromThumb(request.thumb);

  if (image === null || !imageIsLoaded(image)) {
    return false;
  }
  try {
    request.complete(await createImageBitmap(image));
    return true;
  } catch {
    return false;
  }
}

export function fetchBitmap(request: ImageRequest): Promise<boolean> {
  return request.isHighRes ? fetchHighResBitmap(request) : fetchLowResBitmap(request);
}
