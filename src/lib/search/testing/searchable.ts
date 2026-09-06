import { Searchable } from "@/types/search";

export function createSearchable(tags: string[]): Searchable {
  return { tags: new Set(tags) };
}

export const searchableEmptyDoc = createSearchable([]);
