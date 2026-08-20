import { gifTags, videoTags } from "@/lib/media/constants";
import { MediaType } from "@/types/media";
import { hasIntersection } from "@/utils/pure/collection";
import { toSortedTagSet } from "@/utils/pure/tag";

export function resolveMediaType(tags: string | Set<string>): MediaType {
  const tagSet = typeof tags === "string" ? toSortedTagSet(tags) : tags;
  return hasIntersection(tagSet, videoTags) ? "video" : hasIntersection(tagSet, gifTags) ? "gif" : "image";
}
