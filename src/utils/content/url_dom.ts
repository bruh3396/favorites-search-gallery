import * as Extensions from "../../store/indexed_db/extensions";
import * as url from "url";
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

export function getImageURLWithoutExtension(object: HTMLElement | string): string {
  return url.getImageURLWithoutExtension(getThumbURL(object));
}

export function getGIFSource(thumb: HTMLElement): string {
  const tags = getTagSetFromThumb(thumb);
  const extension = tags.has("animated_png") ? "png" : "gif";
  return getImageURLWithoutExtension(thumb).replace("jpg", extension);
}

export async function getImageURL(thumb: HTMLElement): Promise<string> {
  let extension = Extensions.get(thumb.id);

  if (extension === undefined) {
    extension = await Extensions.getExtensionFromThumb(thumb);
  }

  if (extension === null) {

  }

}
