import { TagCategory } from "@/core/domain/tag/tag";

export interface RemoteTagCategories {
  fetch: (tagNames: readonly string[]) => Promise<ReadonlyMap<string, TagCategory>>;
}
