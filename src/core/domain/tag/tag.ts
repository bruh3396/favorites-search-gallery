const TAG_CATEGORIES = ["general", "artist", "unknown", "copyright", "character", "metadata"] as const;
const tagCategories: ReadonlySet<unknown> = new Set(TAG_CATEGORIES);

export type TagCategory = typeof TAG_CATEGORIES[number];
export type TagCategoryMap = ReadonlyMap<string, TagCategory>;

export function isTagCategory(value: unknown): value is TagCategory {
  return tagCategories.has(value);
}

export function toSortedTagSet(tagString: string): Set<string> {
  const set = new Set<string>();

  for (const tag of tagString.split(/\s+/).sort()) {
    if (tag !== "") {
      set.add(tag);
    }
  }
  return set;
}
