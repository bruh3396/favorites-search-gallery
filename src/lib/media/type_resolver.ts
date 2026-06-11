import { gifTags, videoTags } from "@/lib/media/constants";
import { MediaType } from "@/types/media";
import { intersects } from "@/utils/collection/set";
import { toTagSet } from "@/utils/string/tags";

export function resolveMediaType(tags: string | Set<string>): MediaType {
  const tagSet = typeof tags === "string" ? toTagSet(tags) : tags;
  return intersects(tagSet, videoTags) ? "video" : intersects(tagSet, gifTags) ? "gif" : "image";
}
