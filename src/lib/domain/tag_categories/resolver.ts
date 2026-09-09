import * as TagCategoryStore from "@/lib/domain/tag_categories/store";
import { TagCategory, TagCategoryMap } from "@/types/search";
import { fetchPostPageHtml } from "@/lib/remote/pages";
import { fetchTagCategory } from "@/lib/remote/api";
import { parseTagCategoriesFromPostPage } from "@/lib/remote/parsers/post_page";
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
  const category = await fetchTagCategory(tagName);

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
