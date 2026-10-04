import { TagCategoryMap } from "@/core/domain/tag/tag";

export interface LocalTagCategories {
  getMany: (tagNames: string[]) => Promise<TagCategoryMap>;
  setMany: (tagCategories: TagCategoryMap) => Promise<void>;
}
