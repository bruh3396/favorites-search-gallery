import * as TagCategoryResolver from "@/lib/domain/tag/category_resolver";
import { TagCategoryMap } from "@/core/domain/tag/tag";
import { RemoteTagCategories } from "@/core/boundary/ports/remote_tag_categories";

export function resolveAll(remoteTagCategories: RemoteTagCategories, id: string, tags: Set<string>): Promise<TagCategoryMap> {
  return TagCategoryResolver.resolveCategories(remoteTagCategories, [...tags].filter(tag => tag !== id));
}
