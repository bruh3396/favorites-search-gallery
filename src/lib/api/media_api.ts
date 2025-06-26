import { Favorite } from "../../types/interfaces/interfaces";
import { convertPreviewURLToImageURL } from "../../utils/content/image_url";
import { getExtension } from "../global/extensions";
import { getPreviewURL } from "../../utils/dom/dom";

export async function fetchImageBitmap(url: string, abortController?: AbortController): Promise<ImageBitmap> {
  const response = await fetch(url, {signal: abortController?.signal});
  const blob = await response.blob();
  return createImageBitmap(blob);
}

export async function fetchImageBitmapFromThumb(thumb: HTMLElement, abortController?: AbortController): Promise<ImageBitmap> {
  return fetchImageBitmap(await getOriginalImageURL(thumb), abortController);
}

export async function getOriginalContentURL(item: HTMLElement | Favorite): Promise<string> {
  return getOriginalImageURLWithJPGExtension(item).replace(".jpg", `.${await getExtension(item)}`);
}

export async function getOriginalImageURL(item: HTMLElement | Favorite): Promise<string> {
  return (await getOriginalContentURL(item)).replace(".mp4", ".jpg");
}

export function getOriginalImageURLWithJPGExtension(item: HTMLElement | Favorite): string {
  return convertPreviewURLToImageURL(getPreviewURL(item) ?? "");
}
