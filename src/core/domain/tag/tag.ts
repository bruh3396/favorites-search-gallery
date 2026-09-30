const TAG_CATEGORIES = ["general", "artist", "unknown", "copyright", "character", "metadata"] as const;
const tagCategories: ReadonlySet<unknown> = new Set(TAG_CATEGORIES);

export type TagCategory = typeof TAG_CATEGORIES[number];
export type TagCategoryMap = Map<string, TagCategory>;

export function isTagCategory(value: unknown): value is TagCategory {
  return tagCategories.has(value);
}
