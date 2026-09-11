import { ImageExtension, MediaItem } from "@/types/media";
import { isGif, isImage, isVideo } from "@/lib/media/media_type";
import { getImageFromThumb } from "@/lib/ui/thumb/query";

export function toMediaItem(thumb: HTMLElement): MediaItem {
  return {
    id: thumb.id,
    thumbUrl: getImageFromThumb(thumb)?.src ?? "",
    extension: thumb.dataset.extension as ImageExtension | undefined
  };
}

export const isVideoThumb = (thumb: HTMLElement): boolean => isVideo(toMediaItem(thumb));
export const isGifThumb = (thumb: HTMLElement): boolean => isGif(toMediaItem(thumb));
export const isImageThumb = (thumb: HTMLElement): boolean => isImage(toMediaItem(thumb));
