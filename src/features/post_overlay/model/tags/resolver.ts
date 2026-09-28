import * as TagCategoryResolver from "@/lib/domain/tag/category_resolver";
import { TagCategoryMap } from "@/types/search";
import { TagSource } from "@/core/boundary/ports";

export function resolveAll(tagSource: TagSource, id: string, tags: Set<string>): Promise<TagCategoryMap> {
  return TagCategoryResolver.resolveCategories(tagSource, id, [...tags].filter(tag => tag !== id));
}
