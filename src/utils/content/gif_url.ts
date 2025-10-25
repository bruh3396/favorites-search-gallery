import { getOriginalImageURLWithJPGExtension } from "../../lib/api/media_api";
import { getTagSetFromItem } from "../dom/tags";

export function getGIFSource(thumb: HTMLElement): string {
  const tags = getTagSetFromItem(thumb);
  const extension = tags.has("animated_png") ? "png" : "gif";
  return getOriginalImageURLWithJPGExtension(thumb).replace("jpg", extension);
}
