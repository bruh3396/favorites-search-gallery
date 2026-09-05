import { ParsedPost, ServerPost } from "@/types/api";
import { TagCategoryMap } from "@/types/search";
import { decodeHtmlEntities } from "@/utils/pure/string";
import { decodeTagCategory } from "@/lib/remote/parsers/tag";

export function parsePost(post: ServerPost): ParsedPost {
  const { tagCategories: encodedTagCategories, ...rest } = post;
  const tagCategories: TagCategoryMap = new Map();

  for (const [tagName, encoded] of Object.entries(encodedTagCategories)) {
    tagCategories.set(decodeHtmlEntities(tagName), decodeTagCategory(encoded));
  }
  return { post: { ...rest, tags: deriveTags(tagCategories) }, tagCategories };
}

function deriveTags(tagCategories: TagCategoryMap): string {
  return Array.from(tagCategories.keys()).join(" ");
}
