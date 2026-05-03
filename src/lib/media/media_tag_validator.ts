import { Post } from "../../types/post";
import { convertToTagSet } from "../../utils/string/tags";

export function correctTags(post: Post): Set<string> {
  const validTags = convertToTagSet(post.tags);

  validTags.add(post.id);

  if (post.fileURL.endsWith("mp4")) {
    validTags.add("video");
  } else if (post.fileURL.endsWith("gif")) {
    validTags.add("gif");
  } else if (!validTags.has("animated_png")) {
    validTags.delete("video");
    validTags.delete("animated");
  }
  return validTags;
}
