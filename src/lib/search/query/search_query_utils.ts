import { AbstractSearchTag } from "../tag/abstract_search_tag";
import { CategorizedTags } from "../types/search_types";
import { MetadataSearchTag } from "../tag/metadata_search_tag";
import { WildcardSearchTag } from "../tag/wildcard_search_tag";
import { parseSearchTag } from "../tag/search_tag_parser";

export function buildSearchTagGroup(tags: string[]): AbstractSearchTag[] {
  return sortSearchTagGroup(Array.from(new Set(tags)).map(tag => parseSearchTag(tag)));
}

export function sortSearchTagGroup(tags: AbstractSearchTag[]): AbstractSearchTag[] {
  return [...tags].sort((a, b) => a.cost - b.cost);
}

export function categorizeTags(tags: AbstractSearchTag[]): CategorizedTags {
  const positiveTags: AbstractSearchTag[] = [];
  const wildcardTags: WildcardSearchTag[] = [];
  const metadataTags: MetadataSearchTag[] = [];

  for (const tag of tags) {
    if (tag instanceof WildcardSearchTag) {
      wildcardTags.push(tag);
    } else if (tag instanceof MetadataSearchTag) {
      metadataTags.push(tag);
    } else if (!tag.negated) {
      positiveTags.push(tag);
    }
  }
  return { positiveTags, wildcardTags, metadataTags };
}
