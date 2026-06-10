import { Favorite } from "@/types/favorite";
import { MediaType } from "@/types/media";
import { getTagSetFromItem } from "@/lib/thumb/tags";
import { resolveMediaType } from "@/lib/media/type_resolver";

export const isVideo = (item: HTMLElement | Favorite): boolean => isMediaType(item, "video");
export const isGif = (item: HTMLElement | Favorite): boolean => isMediaType(item, "gif");
export const isImage = (item: HTMLElement | Favorite): boolean => isMediaType(item, "image");

function isMediaType(item: HTMLElement | Favorite, mediaType: MediaType): boolean {
  return resolveMediaType(item instanceof HTMLElement ? getTagSetFromItem(item) : item.tags) === mediaType;
}
