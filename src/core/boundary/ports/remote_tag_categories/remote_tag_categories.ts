import { TagCategory } from "@/core/domain/tag_category/tag_category";

export interface RemoteTagCategories {
  fetch: (tagNames: readonly string[]) => Promise<ReadonlyMap<string, TagCategory>>;
}
