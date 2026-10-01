import { RemoteTagCategories } from "@/core/boundary/ports/remote_tag_categories";
import { TagCategoryMap } from "@/core/domain/tag/tag";

export class MemoryRemoteTagCategories implements RemoteTagCategories {
  public fetch(tagNames: string[]): Promise<TagCategoryMap> {
    return Promise.resolve(new Map(tagNames.map(tagName => [tagName, "general"])));
  }
}
