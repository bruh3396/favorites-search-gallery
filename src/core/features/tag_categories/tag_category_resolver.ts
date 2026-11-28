import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";
import { TagCategory } from "@/core/domain/tag_category/tag_category";

export interface TagCategoryResolverDependencies {
  localTagCategories: Pick<LocalTagCategories, "getMany">;
}

export class TagCategoryResolver {
  private tagDictionary: ReadonlyMap<string, TagCategory> = new Map();

  constructor(private readonly dependencies: TagCategoryResolverDependencies) { }

  public prime(tagDictionary: ReadonlyMap<string, TagCategory>): void {
    this.tagDictionary = tagDictionary;
  }

  public resolveCommon(tagName: string): TagCategory | undefined {
    return this.tagDictionary.get(tagName);
  }

  public async resolve(tagNames: readonly string[]): Promise<ReadonlyMap<string, TagCategory>> {
    const { tagDictionary, dependencies: { localTagCategories } } = this;
    const unlistedTagNames = tagNames.filter(tagName => !tagDictionary.has(tagName));
    const storedTagCategories = unlistedTagNames.length === 0 ? new Map<string, TagCategory>() : await localTagCategories.getMany(unlistedTagNames);
    return new Map(tagNames.flatMap(tagName => {
      const tagCategory = tagDictionary.get(tagName) ?? storedTagCategories.get(tagName);
      return tagCategory === undefined ? [] : [[tagName, tagCategory] as const];
    }));
  }
}
