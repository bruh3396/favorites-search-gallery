import { thumbnailUrlToImageUrl as thumbUrlToImageUrl, withExtension } from "@/lib/media/url_transformer";
import { Favorite } from "@/types/favorite";
import { getImageFromThumb } from "@/lib/thumb/thumbs";
import { getTagSetFromItem } from "@/lib/thumb/tag";

export const thumbnailUrl = (item: HTMLElement | Favorite): string | null => (item instanceof HTMLElement ? getImageFromThumb(item)?.src ?? null : item.thumbnailUrl);
export const imageUrl = (item: HTMLElement | Favorite): string => thumbUrlToImageUrl(thumbnailUrl(item) ?? "");
export const videoUrl = (item: HTMLElement | Favorite): string => withExtension(imageUrl(item), "mp4");
export const gifUrl = (item: HTMLElement | Favorite): string => withExtension(imageUrl(item), getTagSetFromItem(item).has("animated_png") ? "png" : "gif");
