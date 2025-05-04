import { MetadataSearchExpression } from "../../../types/metadata/favorite_metadata_search_expression";
import { MetadataSearchTag } from "../search_tags/metadata_search_tag";
import { SearchTag } from "../search_tags/search_tag";
import { WildcardSearchTag } from "../search_tags/wildcard_search_tag";

export function isWildcardSearchTag(tag: string): boolean {
  return tag.includes("*");
}

export function isMetadataSearchTag(tag: string): boolean {
  return MetadataSearchExpression.regex.test(tag);
}

export function createSearchTag(tag: string): SearchTag {
  if (isWildcardSearchTag(tag)) {
    return new WildcardSearchTag(tag);
  }

  if (isMetadataSearchTag(tag)) {
    return new MetadataSearchTag(tag);
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
