import { ParsedPost, ServerPost } from "@/types/api";
import { TagCategoryMap } from "@/types/search";
import { decodeHtmlEntities } from "@/utils/pure/string";
import { decodeTagCategory } from "../../../app/domain/tag/category_codec";

export function parsePost(post: ServerPost): ParsedPost {
  const { tagCategories: encodedTagCategories, ...rest } = post;
  const tagCategories: TagCategoryMap = new Map();

  for (const [tagName, encoded] of Object.entries(encodedTagCategories)) {
    tagCategories.set(decodeHtmlEntities(tagName), decodeTagCategory(encoded));
  }
  return { post: { ...rest, tags: [...tagCategories.keys()].join(" ") }, tagCategories };
}
