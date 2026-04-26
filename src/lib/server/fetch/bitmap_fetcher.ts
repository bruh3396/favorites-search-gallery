import { convertImageURLToSampleURL } from "../url/media_url_transformer";
import { resolveImageURL } from "../url/media_url_resolver";

export function fetchImageBitmap(url: string, abortController?: AbortController): Promise<ImageBitmap> {
  return fetch(url, { signal: abortController?.signal })
    .then((response) => response.blob())
    .then((blob) => createImageBitmap(blob))
    .catch(() => fetchWIMGImageBitmap(url));
}

async function fetchWIMGImageBitmap(url: string): Promise<ImageBitmap> {
  const image = new Image();

  image.src = url.replace("rule34", "wimg.rule34");
  await new Promise<void>((resolve, reject) => {
    image.onload = (): void => resolve();
    image.onerror = (): void => reject(new Error(`Failed to load image: ${image.src}`));
  });
  return createImageBitmap(image);
}

export async function fetchImageBitmapFromThumb(thumb: HTMLElement, abortController?: AbortController): Promise<ImageBitmap> {
  return fetchImageBitmap(await resolveImageURL(thumb), abortController);
}

export async function fetchSampleImageBitmapFromThumb(thumb: HTMLElement, abortController?: AbortController): Promise<ImageBitmap> {
  return fetchImageBitmap(convertImageURLToSampleURL(await resolveImageURL(thumb)), abortController)
    .catch(() => {
      return fetchImageBitmapFromThumb(thumb, abortController);
    });
}
