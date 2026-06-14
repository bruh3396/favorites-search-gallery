import { MediaItem } from "@/types/media";
import { getImageFromThumb } from "@/lib/thumb/thumbs";
import { getTagSetFromThumb } from "@/lib/thumb/tag";

export function toMediaItem(thumb: HTMLElement): MediaItem {
  let tags: Set<string> | null = null;
  return {
    id: thumb.id,
    thumbUrl: getImageFromThumb(thumb)?.src ?? null,
    get tags(): Set<string> {
      if (tags === null) {
        tags = getTagSetFromThumb(thumb);
      }
      return tags;
    }
  };
}
