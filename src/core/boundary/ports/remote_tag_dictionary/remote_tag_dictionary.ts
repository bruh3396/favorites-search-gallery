import { TagCategory } from "@/core/domain/tag_category/tag_category";

export interface RemoteTagDictionary {
  fetch: () => Promise<ReadonlyMap<string, TagCategory>>;
}
