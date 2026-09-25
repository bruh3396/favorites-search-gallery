import { imageUrlToSampleUrl, withRule34WimgHostname } from "@/lib/media/url";
import { MediaItem } from "@/types/media";
import { isImage } from "@/lib/media/media_type";
import { resolveImageUrl } from "@/lib/media/resolver";

export async function fetchFullImageBitmap(item: MediaItem, abortController?: AbortController): Promise<ImageBitmap> {
  return fetchImageBitmap(await resolveImageUrl(item), abortController);
}

export async function fetchSampleImageBitmap(item: MediaItem, abortController?: AbortController): Promise<ImageBitmap> {
  if (!isImage(item)) {
    return fetchFullImageBitmap(item, abortController);
  }
  return fetchImageBitmap(imageUrlToSampleUrl(await resolveImageUrl(item)), abortController)
    .catch(() => fetchFullImageBitmap(item, abortController));
}

export async function imageUrlToBitmap(url: string): Promise<ImageBitmap> {
  const image = new Image();

  image.src = url;
  await new Promise<void>((resolve, reject) => {
    image.onload = (): void => resolve();
    image.onerror = (): void => reject(new Error(`Failed to load image: ${url}`));
  });
  return createImageBitmap(image);
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

function fetchWimgImageBitmap(url: string): Promise<ImageBitmap> {
  return imageUrlToBitmap(withRule34WimgHostname(url));
}
