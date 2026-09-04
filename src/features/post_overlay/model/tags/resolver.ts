import * as PostOverlayTagsCache from "@/features/post_overlay/model/tags/cache";
import * as PostOverlayTagsStore from "@/features/post_overlay/model/tags/store";
import { TagCategory, TagCategoryMap } from "@/types/search";
import { PostOverlayConfig } from "@/config/post_overlay_config";
import { fetchPostPageHtml } from "@/lib/remote/pages";
import { fetchTagCategory } from "@/lib/remote/api";
import { getTagSetFromThumb } from "@/lib/thumb/tag";
import { parseTagCategoriesFromPostPage } from "@/lib/remote/parsers/post_page";
import { withTimeout } from "@/lib/async/scheduling";

export { get as getCachedCategory } from "@/features/post_overlay/model/tags/cache";

export async function preloadCache(): Promise<void> {
  for (const mapping of await PostOverlayTagsStore.readAll()) {
    PostOverlayTagsCache.set(mapping.id, mapping.category);
  }
}

export async function resolveAll(thumb: HTMLElement): Promise<TagCategoryMap> {
  const tagSet = getTagSetFromThumb(thumb);

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
  const cached = PostOverlayTagsCache.get(tagName);

  if (cached !== undefined) {
    return cached;
  }
  const category = await fetchTagCategory(tagName);

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
  if (!PostOverlayTagsCache.has(tagName)) {
    PostOverlayTagsCache.set(tagName, category);
    PostOverlayTagsStore.write({id: tagName, category});
  }
}
