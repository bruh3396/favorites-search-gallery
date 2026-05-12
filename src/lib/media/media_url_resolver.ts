import { Favorite } from "../../types/favorite";
import { baseImageUrl } from "./base_image_url";
import { getTagSetFromItem } from "../dom/tags";
import { resolveExtension } from "./media_extension_resolver";

export async function resolveImageUrl(item: HTMLElement | Favorite): Promise<string> {
  return (await resolveMediaUrl(item)).replace(".mp4", ".jpg");
}

export async function resolveMediaUrl(item: HTMLElement | Favorite): Promise<string> {
  return baseImageUrl(item).replace(".jpg", `.${await resolveExtension(item)}`);
}

export function resolveGifUrl(thumb: HTMLElement | Favorite): string {
  const extension = getTagSetFromItem(thumb).has("animated_png") ? "png" : "gif";
  return baseImageUrl(thumb).replace("jpg", extension);
}
