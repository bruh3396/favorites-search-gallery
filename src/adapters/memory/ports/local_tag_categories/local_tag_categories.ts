import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";
import { TagCategoryMap } from "@/core/domain/tag/tag";

export class MemoryLocalTagCategories implements LocalTagCategories {
  private readonly tagCategories: TagCategoryMap = new Map();

  public getMany(tagNames: string[]): Promise<TagCategoryMap> {
    return Promise.resolve(new Map(tagNames.flatMap(tagName => {
      const tagCategory = this.tagCategories.get(tagName);
      return tagCategory === undefined ? [] : [[tagName, tagCategory]];
    })));
  }

  public setMany(tagCategories: TagCategoryMap): Promise<void> {
    tagCategories.forEach((category, tagName) => this.tagCategories.set(tagName, category));
    return Promise.resolve();
  }
}
