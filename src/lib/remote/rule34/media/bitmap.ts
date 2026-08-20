import { imageUrlToSampleUrl, withRule34WimgHostname } from "@/lib/media/url";
import { isImageThumb, toMediaItem } from "@/lib/thumb/item";
import { resolveImageUrl } from "@/lib/media/resolver";

export async function fetchFullImageBitmapFromThumb(thumb: HTMLElement, abortController?: AbortController): Promise<ImageBitmap> {
  return fetchImageBitmap(await resolveImageUrl(toMediaItem(thumb)), abortController);
}

export async function fetchSampleImageBitmapFromThumb(thumb: HTMLElement, abortController?: AbortController): Promise<ImageBitmap> {
  if (!isImageThumb(thumb)) {
    return fetchFullImageBitmapFromThumb(thumb, abortController);
  }
  return fetchImageBitmap(imageUrlToSampleUrl(await resolveImageUrl(toMediaItem(thumb))), abortController)
    .catch(() => fetchFullImageBitmapFromThumb(thumb, abortController));
}

function fetchImageBitmap(url: string, abortController?: AbortController): Promise<ImageBitmap> {
  return fetch(url, { signal: abortController?.signal })
    .then((response) => response.blob())
    .then((blob) => createImageBitmap(blob))
    .catch((error) => {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
      return fetchWimgImageBitmap(url);
    });
}

async function fetchWimgImageBitmap(url: string): Promise<ImageBitmap> {
  const image = new Image();

  image.src = withRule34WimgHostname(url);
  await new Promise<void>((resolve, reject) => {
    image.onload = (): void => resolve();
    image.onerror = (): void => reject(new Error(`Failed to load image: ${image.src}`));
  });
  return createImageBitmap(image);
}
