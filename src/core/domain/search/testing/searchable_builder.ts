import { Searchable } from "@/core/domain/search/searchable";

export function buildSearchable(tags: string[]): Searchable {
  return { tags: new Set(tags) };
}
