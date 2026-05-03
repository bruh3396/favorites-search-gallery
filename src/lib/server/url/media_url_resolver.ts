import { convertPreviewURLToImageURL, removeIdFromImageURL } from "./media_url_transformer";
import { Favorite } from "../../../types/favorite";
import { getPreviewURL } from "../../ui/dom";
import { getTagSetFromItem } from "../../dom/tags";
import { resolveExtension } from "../../media/media_extension_resolver";

export async function resolveImageURL(item: HTMLElement | Favorite): Promise<string> {
  return (await resolveMediaURL(item)).replace(".mp4", ".jpg");
}

export async function resolveMediaURL(item: HTMLElement | Favorite): Promise<string> {
  return resolveBaseImageURL(item).replace(".jpg", `.${await resolveExtension(item)}`);
}

export function resolveGifUrl(thumb: HTMLElement | Favorite): string {
  const extension = getTagSetFromItem(thumb).has("animated_png") ? "png" : "gif";
  return resolveBaseImageURL(thumb).replace("jpg", extension);
}

export function resolveBaseImageURL(item: HTMLElement | Favorite): string {
  return removeIdFromImageURL(convertPreviewURLToImageURL(getPreviewURL(item) ?? ""));
}
