import { Searchable } from "@/core/domain/search/searchable";

export function createSearchable(tags: string[]): Searchable {
  return { tags: new Set(tags) };
}

export const searchableEmptyDoc = createSearchable([]);
