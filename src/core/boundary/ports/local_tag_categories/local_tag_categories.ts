import { TagCategory } from "@/core/domain/tag_category/tag_category";

export interface LocalTagCategories {
  getMany: (tagNames: readonly string[]) => Promise<ReadonlyMap<string, TagCategory>>;
  setMany: (tagCategories: ReadonlyMap<string, TagCategory>) => Promise<void>;
}
