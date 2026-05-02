import { Post } from "../../types/post";
import { convertToTagSet } from "../../utils/string/tags";

export function getCorrectTags(post: Post): Set<string> {
  const correctTags = convertToTagSet(post.tags);

  correctTags.add(post.id);

  if (post.fileURL.endsWith("mp4")) {
    correctTags.add("video");
  } else if (post.fileURL.endsWith("gif")) {
    correctTags.add("gif");
  } else if (!correctTags.has("animated_png")) {
    correctTags.delete("video");
    correctTags.delete("animated");
  }
  return correctTags;
}
