import { convertThumbURLToImageURL } from "../../utils/content/url";
import { getExtensionFromThumb } from "../../store/indexed_db/extensions";
import { getURLFromThumb } from "../../utils/dom/dom";

export async function fetchImageBitmap(url: string, abortController?: AbortController): Promise<ImageBitmap> {
  const response = await fetch(url, {signal: abortController?.signal});
  const blob = await response.blob();
  return createImageBitmap(blob);
}

export async function fetchImageBitmapFromThumb(thumb: HTMLElement, abortController?: AbortController): Promise<ImageBitmap> {
  return fetchImageBitmap(await getOriginalImageURL(thumb), abortController);
}

export async function getOriginalContentURL(thumb: HTMLElement): Promise<string> {
  const extension = await getExtensionFromThumb(thumb);
  const url = convertThumbURLToImageURL(getURLFromThumb(thumb) ?? "");
  return url.replace(".jpg", `.${extension}`);
}

export async function getOriginalImageURL(thumb: HTMLElement): Promise<string> {
  return (await getOriginalContentURL(thumb)).replace(".mp4", ".jpg");
}
