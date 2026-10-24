import { TagCategory, TagCategoryMap } from "@/core/domain/tag/tag";

const GROUP_ORDER = ["artist", "character", "copyright", "general", "metadata"] as const;

export type TagGroupCategory = typeof GROUP_ORDER[number];

export interface TagGroup {
  readonly category: TagGroupCategory;
  readonly tags: readonly string[];
}

export function groupTagsByCategory(tags: Iterable<string>, categories: TagCategoryMap): TagGroup[] {
  const groups = new Map<TagGroupCategory, string[]>(GROUP_ORDER.map(category => [category, []]));

  for (const tag of tags) {
    groups.get(toGroupCategory(categories.get(tag)))?.push(tag);
  }
  return GROUP_ORDER
    .map(category => ({ category, tags: (groups.get(category) ?? []).sort() }))
    .filter(group => group.tags.length > 0);
}

function toGroupCategory(category: TagCategory | undefined): TagGroupCategory {
  return category === undefined || category === "unknown" ? "general" : category;
}
