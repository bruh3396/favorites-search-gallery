import * as TagCategoryResolver from "@/lib/domain/tag/category_resolver";
import { TagCategoryMap } from "@/types/search";

export function resolveAll(id: string, tags: Set<string>): Promise<TagCategoryMap> {
  return TagCategoryResolver.resolveCategories(id, [...tags].filter(tag => tag !== id));
}
