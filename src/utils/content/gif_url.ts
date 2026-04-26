import { resolveBaseImageURL } from "../../lib/server/url/media_url_resolver";
import { getTagSetFromItem } from "../dom/tags";

export function getGIFSource(thumb: HTMLElement): string {
  const tags = getTagSetFromItem(thumb);
  const extension = tags.has("animated_png") ? "png" : "gif";
  return resolveBaseImageURL(thumb).replace("jpg", extension);
}
