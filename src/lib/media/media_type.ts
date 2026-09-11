import { EncodedMediaType, MediaExtension, MediaItem, MediaType } from "@/types/media";
import { gifTags, videoTags } from "@/lib/media/constants";
import { hasIntersection } from "@/utils/pure/set";
import { toSortedTagSet } from "@/utils/pure/tag";

const MEDIA_TYPES: readonly MediaType[] = ["image", "video", "gif"];

export function resolveMediaType(tags: string | Set<string>): MediaType {
  return decodeMediaType(deriveMediaType(tags));
}

export function decodeMediaType(encoded: number): MediaType {
  return MEDIA_TYPES[encoded] ?? "image";
}

export function encodeMediaType(extension: MediaExtension | MediaType): EncodedMediaType {
  switch (extension) {
    case "mp4":
    case "video":
      return 1;
    case "gif":
      return 2;
    default: return 0;
  }
}

export const isVideo = (item: MediaItem): boolean => isMediaType(item, "video");
export const isGif = (item: MediaItem): boolean => isMediaType(item, "gif");
export const isImage = (item: MediaItem): boolean => isMediaType(item, "image");

const isMediaType = (item: MediaItem, mediaType: MediaType): boolean => item.mediaType === mediaType;

function deriveMediaType(tags: string | Set<string>): EncodedMediaType {
  const tagSet = typeof tags === "string" ? toSortedTagSet(tags) : tags;
  return hasIntersection(tagSet, videoTags) ? EncodedMediaType.Video : hasIntersection(tagSet, gifTags) ? EncodedMediaType.Gif : EncodedMediaType.Image;
}
