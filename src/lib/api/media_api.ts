import { Favorite } from "../../types/interfaces/interfaces";
import { convertPreviewURLToImageURL } from "../../utils/content/url";
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
  const extension = await getExtension(item);
  const url = convertPreviewURLToImageURL(getPreviewURL(item) ?? "");
  return url.replace(".jpg", `.${extension}`);
}

export async function getOriginalImageURL(thumb: HTMLElement): Promise<string> {
  return (await getOriginalContentURL(thumb)).replace(".mp4", ".jpg");
}
