import { TagCategoryMap } from "@/core/domain/tag/tag";

export interface RemoteTagCategories {
  fetch: (tagNames: string[]) => Promise<TagCategoryMap>;
}
