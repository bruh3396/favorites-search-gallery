import { MediaItem, MediaType } from "@/types/media";
import { resolveMediaType } from "@/lib/media/type_resolver";
import { toMediaItem } from "@/lib/thumb/item";

export const isVideo = (item: MediaItem): boolean => isMediaType(item, "video");
export const isGif = (item: MediaItem): boolean => isMediaType(item, "gif");
export const isImage = (item: MediaItem): boolean => isMediaType(item, "image");

export const isVideoThumb = (thumb: HTMLElement): boolean => isVideo(toMediaItem(thumb));
export const isGifThumb = (thumb: HTMLElement): boolean => isGif(toMediaItem(thumb));
export const isImageThumb = (thumb: HTMLElement): boolean => isImage(toMediaItem(thumb));

const isMediaType = (item: MediaItem, mediaType: MediaType): boolean => resolveMediaType(item.tags) === mediaType;
