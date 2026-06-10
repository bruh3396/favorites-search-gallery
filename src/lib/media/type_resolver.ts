import { gifTags, videoTags } from "@/lib/media/constants";
import { MediaType } from "@/types/media";
import { convertToTagSet } from "@/utils/string/tags";
import { intersects } from "@/utils/collection/set";

export function resolveMediaType(tags: string | Set<string>): MediaType {
  const tagSet = typeof tags === "string" ? convertToTagSet(tags) : tags;
  return intersects(tagSet, videoTags) ? "video" : intersects(tagSet, gifTags) ? "gif" : "image";
}
