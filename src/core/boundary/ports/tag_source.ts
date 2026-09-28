import { TagCategoryMap } from "@/types/search";

export interface TagSource {
  categorize: (id: string, tagNames: string[]) => Promise<TagCategoryMap>;
}
