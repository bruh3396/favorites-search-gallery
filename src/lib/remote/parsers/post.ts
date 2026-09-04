import { ServerPost } from "@/types/api";
import { Post } from "@/types/api";
import { TagCategoryMap } from "@/types/search";
import { decodeHtmlEntities } from "@/utils/pure/string";
import { decodeTagCategory } from "@/lib/remote/parsers/tag";

export function parsePost(post: ServerPost): Post {
  const tagCategories: TagCategoryMap = new Map();

  for (const [tagName, encoded] of Object.entries(post.tagCategories)) {
    tagCategories.set(decodeHtmlEntities(tagName), decodeTagCategory(encoded));
  }
  return { ...post, tags: deriveTags(tagCategories), tagCategories };
}

function deriveTags(tagCategories: TagCategoryMap): string {
  return Array.from(tagCategories.keys()).join(" ");
}
