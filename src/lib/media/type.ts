import { MediaItem, MediaType } from "@/types/media";
import { gifTags, videoTags } from "@/lib/media/constants";
import { hasIntersection } from "@/utils/pure/set";
import { toSortedTagSet } from "@/utils/pure/tag";

export function resolveMediaType(tags: string | Set<string>): MediaType {
  const tagSet = typeof tags === "string" ? toSortedTagSet(tags) : tags;
  return hasIntersection(tagSet, videoTags) ? "video" : hasIntersection(tagSet, gifTags) ? "gif" : "image";
}

export const isVideo = (item: MediaItem): boolean => isMediaType(item, "video");
export const isGif = (item: MediaItem): boolean => isMediaType(item, "gif");
export const isImage = (item: MediaItem): boolean => isMediaType(item, "image");

const isMediaType = (item: MediaItem, mediaType: MediaType): boolean => resolveMediaType(item.tags) === mediaType;
