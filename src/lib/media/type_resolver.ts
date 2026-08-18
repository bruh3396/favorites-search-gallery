import { gifTags, videoTags } from "@/lib/media/constants";
import { MediaType } from "@/types/media";
import { intersects } from "@/utils/pure/collection";
import { toSortedTagSet } from "@/utils/pure/tag";

export function resolveMediaType(tags: string | Set<string>): MediaType {
  const tagSet = typeof tags === "string" ? toSortedTagSet(tags) : tags;
  return intersects(tagSet, videoTags) ? "video" : intersects(tagSet, gifTags) ? "gif" : "image";
}
