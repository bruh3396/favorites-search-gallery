import { ImageRequest } from "@/features/gallery/types/image_request";
import { ThrottledQueue } from "@/lib/async/throttled_queue";
import { fetchImageBitmapFromThumb } from "@/lib/remote/rule34/media/bitmap";
import { getImageFromThumb } from "@/lib/thumb/thumbs";
import { imageIsLoaded } from "@/utils/dom/image";

const fetchQueue = new ThrottledQueue(10);

export function fetchBitmap(request: ImageRequest): Promise<boolean> {
  return request.isHighRes ? fetchHighResBitmap(request) : fetchLowResBitmap(request);
}

async function fetchHighResBitmap(request: ImageRequest): Promise<boolean> {
  await fetchQueue.wait();

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

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
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
