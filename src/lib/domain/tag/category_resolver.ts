import * as TagCategoryStore from "@/lib/domain/tag/category_store";
import { TagCategoryMap } from "@/core/domain/tag/tag";
import { TagSource } from "@/core/boundary/ports/tag_source";

export async function resolveCategories(tagSource: TagSource, tagNames: string[]): Promise<TagCategoryMap> {
  const categoryMap: TagCategoryMap = new Map();
  const uncached: string[] = [];

  for (const tagName of tagNames) {
    const cached = TagCategoryStore.get(tagName);

    if (cached === undefined) {
      uncached.push(tagName);
    } else {
      categoryMap.set(tagName, cached);
    }
  }

  if (uncached.length === 0) {
    return categoryMap;
  }

  try {
    const fetched = await tagSource.fetchCategories(uncached);

    TagCategoryStore.persistAll(fetched);

    for (const [tagName, category] of fetched) {
      categoryMap.set(tagName, category);
    }
  } catch (error) {
    console.error(error);

    for (const tagName of uncached) {
      categoryMap.set(tagName, "general");
    }
  }
  return categoryMap;
}
