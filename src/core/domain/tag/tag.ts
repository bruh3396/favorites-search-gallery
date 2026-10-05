import { copyString } from "@/core/utils/string/string";

const TAG_CATEGORIES = ["general", "artist", "unknown", "copyright", "character", "metadata"] as const;
const tagCategories: ReadonlySet<unknown> = new Set(TAG_CATEGORIES);

export type TagCategory = typeof TAG_CATEGORIES[number];
export type TagCategoryMap = Map<string, TagCategory>;

export function isTagCategory(value: unknown): value is TagCategory {
  return tagCategories.has(value);
}

export function toTagSet(tagString: string): Set<string> {
  if (tagString === "") {
    return new Set();
  }
  const tags = new Set<string>();

  for (const tag of tagString.split(" ")) {
    tags.add(copyString(tag));
  }
  return tags;
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
