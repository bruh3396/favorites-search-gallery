import * as url from "./url";
import { getImageFromThumb } from "../dom/dom";
import { getTagSetFromThumb } from "../dom/tags";

function getThumbURL(object: HTMLElement | string): string {
  if (typeof object === "string") {
    return object;
  }
  const image = getImageFromThumb(object);

  if (image === null) {
    return "";
  }
  return image.src ?? "";
}

function getImageURLWithoutExtension(object: HTMLElement | string): string {
  return url.convertPreviewURLToImageURL(getThumbURL(object));
}

export function getGIFSource(thumb: HTMLElement): string {
  const tags = getTagSetFromThumb(thumb);
  const extension = tags.has("animated_png") ? "png" : "gif";
  return getImageURLWithoutExtension(thumb).replace("jpg", extension);
}
