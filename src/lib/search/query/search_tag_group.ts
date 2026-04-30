import { AbstractSearchTag } from "../tag/abstract_search_tag";
import { CategorizedTags } from "../types/search_types";
import { MetadataSearchTag } from "../tag/metadata_search_tag";
import { WildcardSearchTag } from "../tag/wildcard_search_tag";
import { parseSearchTag } from "../tag/search_tag_parser";
import { removeExtraWhiteSpace } from "../../../utils/string/format";

const OR_GROUP_REGEX = /(?:^|\s+)\(\s+((?:\S+)(?:(?:\s+~\s+)\S+)*)\s+\)/g;

export function normalizeSearchQuery(searchQuery: string): string {
  return removeExtraWhiteSpace(searchQuery).toLowerCase();
}

function parseAndTags(searchQuery: string): string[] {
  return removeExtraWhiteSpace(searchQuery.replace(OR_GROUP_REGEX, "")).split(" ").filter((tag) => tag !== "");
}

function parseOrGroups(searchQuery: string): string[][] {
  return Array.from(searchQuery.matchAll(OR_GROUP_REGEX)).map((orGroup) => orGroup[1].split(" ~ "));
}

export function parseTagGroups(searchQuery: string): { orGroups: string[][]; andTags: string[]; } {
  searchQuery = normalizeSearchQuery(searchQuery);
  return { andTags: parseAndTags(searchQuery), orGroups: parseOrGroups(searchQuery) };
}

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
