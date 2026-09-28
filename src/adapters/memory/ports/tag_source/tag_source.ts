import { TagCategoryMap } from "@/core/domain/tag/tag";
import { TagSource } from "@/core/boundary/ports/tag_source";

export class MemoryTagSource implements TagSource {
  public fetchCategories(tagNames: string[]): Promise<TagCategoryMap> {
    return Promise.resolve(new Map(tagNames.map(tagName => [tagName, "general"])));
  }
}
