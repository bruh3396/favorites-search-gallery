import { RemoteTagCategories } from "@/core/boundary/ports/remote_tag_categories/remote_tag_categories";
import { TagCategory } from "@/core/domain/tag/tag";

export class MemoryRemoteTagCategories implements RemoteTagCategories {
  public fetch(tagNames: readonly string[]): Promise<ReadonlyMap<string, TagCategory>> {
    return Promise.resolve(new Map(tagNames.map(tagName => [tagName, "general"])));
  }
}
