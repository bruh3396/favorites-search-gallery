import {SearchTag} from "./search_tag";
import {WildcardSearchTag} from "./wildcard_search_tag";

export function isWildcardSearchTag(tag: string): boolean {
  return tag.includes("*");
}

export function createSearchTag(tag: string): SearchTag {
  if (isWildcardSearchTag(tag)) {
    return new WildcardSearchTag(tag);
  }
  return new SearchTag(tag);
}

export function createSearchTagGroup(tags: string[]): SearchTag[] {
  const searchTags = Array.from(new Set(tags)).map(tag => createSearchTag(tag));
  return sortSearchTagGroup(searchTags);
}

export function sortSearchTagGroup(searchTags: SearchTag[]): SearchTag[] {
  return searchTags.sort((a, b) => {
    return a.finalCost - b.finalCost;
  });
}
