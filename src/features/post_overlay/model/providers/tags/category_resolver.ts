import * as PostApi from "../../../../../lib/remote/api/post_fetcher";
import * as PostOverlayCategoryCache from "./category_cache";
import * as PostOverlayCategoryStore from "./category_store";
import * as TagApi from "../../../../../lib/remote/api/tag_fetcher";
import { PostOverlayConfig } from "../../../../../config/post_overlay_config";
import { TagCategory } from "../../../../../types/search";
import { decodeTagCategory } from "../../../../../lib/remote/parsers/api_tag_parser";
import { getTagSetFromItem } from "../../../../../lib/thumb/thumb_tags";
import { parseTagCategoriesFromPostPage } from "../../../../../lib/remote/parsers/post_page_parser";
import { withTimeout } from "../../../../../lib/async/timing";

export async function preloadCache(): Promise<void> {
  for (const mapping of await PostOverlayCategoryStore.readAll()) {
    PostOverlayCategoryCache.set(mapping.id, mapping.category);
  }
}

export async function resolveAll(thumb: HTMLElement): Promise<Map<string, TagCategory>> {
  const tagSet = getTagSetFromItem(thumb);

  tagSet.delete(thumb.id);
  const tagsToResolve = Array.from(tagSet);
  const categories = new Map<string, TagCategory>();

  try {
    await withTimeout(Promise.all(tagsToResolve.map(async(tagName) => {
      categories.set(tagName, await resolve(tagName));
    })), PostOverlayConfig.categoryResolveTimeout);
    return categories;
  } catch {
    return resolveFromPostPage(thumb.id, tagsToResolve);
  }
}

async function resolve(tagName: string): Promise<TagCategory> {
  const cached = PostOverlayCategoryCache.get(tagName);

  if (cached !== undefined) {
    return cached;
  }
  const category = decodeTagCategory(await TagApi.fetchTagCategory(tagName));

  persist(tagName, category);
  return category;
}

async function resolveFromPostPage(postId: string, tagsToResolve: string[]): Promise<Map<string, TagCategory>> {
  const categories = new Map<string, TagCategory>();

  try {
    const pageCategories = parseTagCategoriesFromPostPage(await PostApi.fetchPostPageHtml(postId));

    for (const tagName of tagsToResolve) {
      const category = pageCategories.get(tagName) ?? "general";

      persist(tagName, category);
      categories.set(tagName, category);
    }
  } catch (error) {
    console.error(error);

    for (const tagName of tagsToResolve) {
      categories.set(tagName, "general");
    }
  }
  return categories;
}

function persist(tagName: string, category: TagCategory): void {
  if (!PostOverlayCategoryCache.has(tagName)) {
    PostOverlayCategoryCache.set(tagName, category);
    PostOverlayCategoryStore.write({id: tagName, category});
  }
}
