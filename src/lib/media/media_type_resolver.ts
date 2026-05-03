import { MediaType } from "../../types/media";
import { convertToTagSet } from "../../utils/string/tags";

export function resolveMediaType(tags: string | Set<string>): MediaType {
  const tagSet = typeof tags === "string" ? convertToTagSet(tags) : tags;

  if (tagSet.has("video") || tagSet.has("mp4")) {
    return "video";
  }
  return (tagSet.has("gif") || tagSet.has("animated")) ? "gif" : "image";
}
