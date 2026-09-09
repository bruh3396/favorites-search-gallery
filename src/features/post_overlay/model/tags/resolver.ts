import * as TagCategoryResolver from "@/lib/domain/tag_categories/resolver";
import { TagCategoryMap } from "@/types/search";
import { getTagSetFromThumb } from "@/lib/ui/thumb/tag";

export function resolveAll(thumb: HTMLElement): Promise<TagCategoryMap> {
  const tagSet = getTagSetFromThumb(thumb);

  tagSet.delete(thumb.id);
  return TagCategoryResolver.resolveCategories(thumb.id, [...tagSet]);
}
