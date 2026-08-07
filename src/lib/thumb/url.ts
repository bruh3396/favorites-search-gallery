import { thumbUrlToImageUrl, withExtension } from "@/lib/media/url_transformer";
import { MediaItem } from "@/types/media";

export const imageUrl = (item: MediaItem): string => thumbUrlToImageUrl(item.thumbUrl ?? "");
export const videoUrl = (item: MediaItem): string => withExtension(imageUrl(item), "mp4");
export const gifUrl = (item: MediaItem): string => withExtension(imageUrl(item), item.tags.has("animated_png") ? "png" : "gif");
