import { TagCategoryMap } from "@/types/search";
import { TagSource } from "@/core/boundary/ports/tag_source";

export class MemoryTagSource implements TagSource {
  public categorize(_postId: string, tagNames: string[]): Promise<TagCategoryMap> {
    return Promise.resolve(new Map(tagNames.map(tagName => [tagName, "general"])));
  }
}
