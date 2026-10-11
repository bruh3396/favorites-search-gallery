import { TagCategory, TagCategoryMap } from "@/core/domain/tag/tag";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";

export class MemoryLocalTagCategories implements LocalTagCategories {
  private readonly tagCategories: TagCategoryMap = new Map();

  public getMany(tagNames: readonly string[]): Promise<ReadonlyMap<string, TagCategory>> {
    return Promise.resolve(new Map(tagNames.flatMap(tagName => {
      const tagCategory = this.tagCategories.get(tagName);
      return tagCategory === undefined ? [] : [[tagName, tagCategory]];
    })));
  }

  public setMany(tagCategories: ReadonlyMap<string, TagCategory>): Promise<void> {
    tagCategories.forEach((category, tagName) => this.tagCategories.set(tagName, category));
    return Promise.resolve();
  }
}
