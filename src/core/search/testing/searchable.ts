import { Searchable } from "@/core/search/searchable";

export function createSearchable(tags: string[]): Searchable {
  return { tags: new Set(tags) };
}

export const searchableEmptyDoc = createSearchable([]);
