import { convertToTagSet, convertToTagString } from "@/utils/string/tags";
import { Favorite } from "@/types/favorite";
import { Post } from "@/types/api";
import { fetchTagCategory } from "@/lib/remote/api/tag";

export function tagsAreValid(favorite: Favorite, post: Post): boolean {
  const validTags = correctTags(post);
  const difference = favorite.tags.symmetricDifference(validTags);
  const equal = difference.size === 0 || (difference.size === 1 && difference.has(post.id));

  if (equal) {
    return true;
  }
  post.tags = convertToTagString(validTags);
  return false;
}

export async function isOfficialTag(tagName: string): Promise<boolean> {
  try {
    const category = await fetchTagCategory(tagName);
    return category !== null;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function correctTags(post: Post): Set<string> {
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
