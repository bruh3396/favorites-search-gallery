import * as TagCategoryResolver from "@/lib/domain/tag/category_resolver";
import { TagCategoryMap } from "@/core/domain/tag/tag";
import { TagSource } from "@/core/boundary/ports/tag_source";

export function resolveAll(tagSource: TagSource, id: string, tags: Set<string>): Promise<TagCategoryMap> {
  return TagCategoryResolver.resolveCategories(tagSource, [...tags].filter(tag => tag !== id));
}
