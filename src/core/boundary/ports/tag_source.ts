import { TagCategoryMap } from "@/core/domain/tag/tag";

export interface TagSource {
  fetchCategories: (tagNames: string[]) => Promise<TagCategoryMap>;
}
