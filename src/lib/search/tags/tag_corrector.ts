import { toSortedTagSet, toSortedTagString } from "@/utils/pure/tag";
import { Favorite } from "@/types/favorite";
import { Post } from "@/types/api";

export function tagsNeedCorrection(favorite: Favorite, post: Post): boolean {
  const validTags = correctTags(post);
  const difference = favorite.tags.symmetricDifference(validTags);
  const isEqual = difference.size === 0 || (difference.size === 1 && difference.has(post.id));

  if (isEqual) {
    return false;
  }
  post.tags = toSortedTagString(validTags);
  return true;
}

function correctTags(post: Post): Set<string> {
  const validTags = toSortedTagSet(post.tags);

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
