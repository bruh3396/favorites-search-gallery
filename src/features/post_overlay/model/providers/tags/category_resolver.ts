import * as PostOverlayCategoryCache from "./category_cache";
import * as PostOverlayCategoryStore from "./category_store";
import * as TagApi from "../../../../../lib/remote/api/tag_fetcher";
import { TagCategory } from "../../../../../types/search";
import { decodeTagCategory } from "../../../../../lib/remote/parsers/api_tag_parser";

export async function preloadCache(): Promise<void> {
  for (const mapping of await PostOverlayCategoryStore.readAll()) {
    PostOverlayCategoryCache.set(mapping.id, mapping.category);
  }
}

export async function resolveCategories(tagNames: string[]): Promise<Map<string, TagCategory>> {
  const categories = new Map<string, TagCategory>();

  await Promise.all(tagNames.map(async(tagName) => {
    categories.set(tagName, await resolveCategory(tagName));
  }));
  return categories;
}

async function resolveCategory(tagName: string): Promise<TagCategory> {
  const cached = PostOverlayCategoryCache.get(tagName);

  if (cached !== undefined) {
    return cached;
  }
  const category = decodeTagCategory(await TagApi.fetchTagCategory(tagName));

  PostOverlayCategoryCache.set(tagName, category);
  PostOverlayCategoryStore.write({id: tagName, category});
  return category;
}
