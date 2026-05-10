import { convertPreviewUrlToImageUrl, removeIdFromImageUrl } from "./media_url_transformer";
import { Favorite } from "../../types/favorite";
import { getPreviewUrl } from "../ui/dom";
import { getTagSetFromItem } from "../dom/tags";
import { resolveExtension } from "./media_extension_resolver";

export async function resolveImageUrl(item: HTMLElement | Favorite): Promise<string> {
  return (await resolveMediaUrl(item)).replace(".mp4", ".jpg");
}

export async function resolveMediaUrl(item: HTMLElement | Favorite): Promise<string> {
  return resolveBaseImageUrl(item).replace(".jpg", `.${await resolveExtension(item)}`);
}

export function resolveGifUrl(thumb: HTMLElement | Favorite): string {
  const extension = getTagSetFromItem(thumb).has("animated_png") ? "png" : "gif";
  return resolveBaseImageUrl(thumb).replace("jpg", extension);
}

export function resolveBaseImageUrl(item: HTMLElement | Favorite): string {
  return removeIdFromImageUrl(convertPreviewUrlToImageUrl(getPreviewUrl(item) ?? ""));
}
