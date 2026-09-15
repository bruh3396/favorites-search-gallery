import { ImageExtension, MediaItem, MediaType } from "@/types/media";
import { isGif, isImage, isVideo, resolveMediaType } from "@/lib/media/media_type";
import { getImageFromThumb } from "@/lib/ui/thumb/query";
import { getTagsFromThumb } from "@/lib/ui/thumb/tag";

export function toMediaItem(thumb: HTMLElement): MediaItem {
  return {
    id: thumb.id,
    thumbUrl: getImageFromThumb(thumb)?.src ?? "",
    mediaType: thumb.dataset.mediaType as MediaType ?? resolveMediaType(getTagsFromThumb(thumb)),
    extension: thumb.dataset.extension as ImageExtension | undefined
  };
}

export const isVideoThumb = (thumb: HTMLElement): boolean => isVideo(toMediaItem(thumb));
export const isGifThumb = (thumb: HTMLElement): boolean => isGif(toMediaItem(thumb));
export const isImageThumb = (thumb: HTMLElement): boolean => isImage(toMediaItem(thumb));
