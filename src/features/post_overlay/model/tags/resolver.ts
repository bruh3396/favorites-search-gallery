import * as PostOverlayCategoryCache from "@/features/post_overlay/model/tags/cache";
import * as PostOverlayCategoryStore from "@/features/post_overlay/model/tags/store";
import { TagCategory, TagCategoryMap } from "@/types/search";
import { PostOverlayConfig } from "@/config/post_overlay_config";
import { decodeTagCategory } from "@/lib/remote/parsers/tag";
import { fetchPostPageHtml } from "@/lib/remote/rule34/posts/page";
import { fetchTagCategory } from "@/lib/remote/api/tag";
import { getTagSetFromItem } from "@/lib/thumb/tag";
import { parseTagCategoriesFromPostPage } from "@/lib/remote/parsers/post_page";
import { withTimeout } from "@/lib/async/timing";

export { destroy as destroyStore } from "@/features/post_overlay/model/tags/store";

export async function preloadCache(): Promise<void> {
  for (const mapping of await PostOverlayCategoryStore.readAll()) {
    PostOverlayCategoryCache.set(mapping.id, mapping.category);
  }
}

export async function resolveAll(thumb: HTMLElement): Promise<TagCategoryMap> {
  const tagSet = getTagSetFromItem(thumb);

  tagSet.delete(thumb.id);
  const tagsToResolve = Array.from(tagSet);
  const categoryMap: TagCategoryMap = new Map();

  try {
    await withTimeout(Promise.all(tagsToResolve.map(async(tagName) => {
      categoryMap.set(tagName, await resolve(tagName));
    })), PostOverlayConfig.categoryResolveTimeout);
    return categoryMap;
  } catch {
    return resolveFromPostPage(thumb.id, tagsToResolve);
  }
}

export function warmCache(categoryMap: TagCategoryMap): void {
  for (const [tagName, category] of categoryMap) {
    persist(tagName, category);
  }
}

async function resolve(tagName: string): Promise<TagCategory> {
  const cached = PostOverlayCategoryCache.get(tagName);

  if (cached !== undefined) {
    return cached;
  }
  const category = decodeTagCategory(await fetchTagCategory(tagName));

  persist(tagName, category);
  return category;
}

async function resolveFromPostPage(postId: string, tagsToResolve: string[]): Promise<TagCategoryMap> {
  const categoryMap: TagCategoryMap = new Map();

  try {
    const pageCategories = parseTagCategoriesFromPostPage(await fetchPostPageHtml(postId));

    for (const tagName of tagsToResolve) {
      const category = pageCategories.get(tagName) ?? "general";

      persist(tagName, category);
      categoryMap.set(tagName, category);
    }
  } catch (error) {
    console.error(error);

    for (const tagName of tagsToResolve) {
      categoryMap.set(tagName, "general");
    }
  }
  return categoryMap;
}

function persist(tagName: string, category: TagCategory): void {
  if (!PostOverlayCategoryCache.has(tagName)) {
    PostOverlayCategoryCache.set(tagName, category);
    PostOverlayCategoryStore.write({id: tagName, category});
  }
}
