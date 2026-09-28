import * as TagCategoryStore from "@/lib/domain/tag/category_store";
import { TagCategory, TagCategoryMap } from "@/types/search";
import { fetchPostPageHtml } from "@/adapters/rule34/client/post_page/post_page";
import { ApiTags } from "@/adapters/api/tag_source/tag_source";
import { parseTagCategoriesFromPostPage } from "@/adapters/rule34/client/post_page/parser";
import { withTimeout } from "@/lib/async/scheduling";

const RESOLVE_TIMEOUT_MS = 10_000;

export async function resolveCategories(postId: string, tagNames: string[]): Promise<TagCategoryMap> {
  const categoryMap: TagCategoryMap = new Map();

  try {
    await withTimeout(Promise.all(tagNames.map(async(tagName) => {
      categoryMap.set(tagName, await resolve(tagName));
    })), RESOLVE_TIMEOUT_MS);
    return categoryMap;
  } catch {
    return resolveFromPostPage(postId, tagNames);
  }
}

async function resolve(tagName: string): Promise<TagCategory> {
  const cached = TagCategoryStore.get(tagName);

  if (cached !== undefined) {
    return cached;
  }
  const category = await ApiTags.fetch(tagName);

  TagCategoryStore.persist(tagName, category);
  return category;
}

async function resolveFromPostPage(postId: string, tagNames: string[]): Promise<TagCategoryMap> {
  const categoryMap: TagCategoryMap = new Map();

  try {
    const pageCategories = parseTagCategoriesFromPostPage(await fetchPostPageHtml(postId));

    for (const tagName of tagNames) {
      const category = pageCategories.get(tagName) ?? "general";

      TagCategoryStore.persist(tagName, category);
      categoryMap.set(tagName, category);
    }
  } catch (error) {
    console.error(error);

    for (const tagName of tagNames) {
      categoryMap.set(tagName, "general");
    }
  }
  return categoryMap;
}
