import { convertImageURLToSampleURL, convertPreviewURLToImageURL, removeIdFromImageURL } from "../../utils/content/image_url";
import { Favorite } from "../../types/favorite_types";
import { getExtension } from "../global/extensions";
import { getPreviewURL } from "../../utils/dom/dom";

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
  return fetchImageBitmap(await getOriginalImageURL(thumb), abortController);
}

export async function fetchSampleImageBitmapFromThumb(thumb: HTMLElement, abortController?: AbortController): Promise<ImageBitmap> {
  return fetchImageBitmap(convertImageURLToSampleURL(await getOriginalImageURL(thumb)), abortController)
    .catch(() => {
      return fetchImageBitmapFromThumb(thumb, abortController);
    });
}

export async function getOriginalImageURL(item: HTMLElement | Favorite): Promise<string> {
  return (await getOriginalContentURL(item)).replace(".mp4", ".jpg");
}

export async function getOriginalContentURL(item: HTMLElement | Favorite): Promise<string> {
  return getOriginalImageURLWithJPGExtension(item).replace(".jpg", `.${await getExtension(item)}`);
}

export function getOriginalImageURLWithJPGExtension(item: HTMLElement | Favorite): string {
  return removeIdFromImageURL(convertPreviewURLToImageURL(getPreviewURL(item) ?? ""));
}
