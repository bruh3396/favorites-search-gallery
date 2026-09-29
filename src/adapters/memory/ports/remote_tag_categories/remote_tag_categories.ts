import { TagCategoryMap } from "@/core/domain/tag/tag";
import { RemoteTagCategories } from "@/core/boundary/ports/remote_tag_categories";

export class MemoryRemoteTagCategories implements RemoteTagCategories {
  public fetch(tagNames: string[]): Promise<TagCategoryMap> {
    return Promise.resolve(new Map(tagNames.map(tagName => [tagName, "general"])));
  }
}
