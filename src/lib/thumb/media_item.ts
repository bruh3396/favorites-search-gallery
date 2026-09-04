import { ImageExtension, MediaItem } from "@/types/media";
import { isGif, isImage, isVideo } from "@/lib/media/type";
import { getImageFromThumb } from "@/lib/thumb/query";
import { getTagSetFromThumb } from "@/lib/thumb/tag";

export function toMediaItem(thumb: HTMLElement): MediaItem {
  let tags: Set<string> | null = null;
  return {
    id: thumb.id,
    thumbUrl: getImageFromThumb(thumb)?.src ?? "",
    extension: thumb.dataset.extension as ImageExtension | undefined,
    get tags(): Set<string> {
      if (tags === null) {
        tags = getTagSetFromThumb(thumb);
      }
      return tags;
    }
  };
}

export const isVideoThumb = (thumb: HTMLElement): boolean => isVideo(toMediaItem(thumb));
export const isGifThumb = (thumb: HTMLElement): boolean => isGif(toMediaItem(thumb));
export const isImageThumb = (thumb: HTMLElement): boolean => isImage(toMediaItem(thumb));
