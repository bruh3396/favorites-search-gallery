import { getOriginalImageURLWithJPGExtension } from "../../lib/api/media_api";
import { getTagSetFromThumb } from "../dom/tags";

export function getGIFSource(thumb: HTMLElement): string {
  const tags = getTagSetFromThumb(thumb);
  const extension = tags.has("animated_png") ? "png" : "gif";
  return getOriginalImageURLWithJPGExtension(thumb).replace("jpg", extension);
}
