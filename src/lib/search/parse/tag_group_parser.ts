import { AbstractTag } from "../tags/abstract_tag";
import { CategorizedTags } from "../types/search_types";
import { MetadataTag } from "../tags/metadata_tag";
import { WildcardTag } from "../tags/wildcard_tag";
import { parseTag } from "./tag_parser";
import { removeExtraWhiteSpace } from "../../../utils/string/format";

const orGroupRegex = /(?:^|\s+)\(\s+((?:\S+)(?:(?:\s+~\s+)\S+)*)\s+\)/g;

export function normalizeSearchQuery(searchQuery: string): string {
  return removeExtraWhiteSpace(searchQuery).toLowerCase();
}

function parseAndTags(searchQuery: string): string[] {
  return removeExtraWhiteSpace(searchQuery.replace(orGroupRegex, "")).split(" ").filter((tag) => tag !== "");
}

function parseOrGroups(searchQuery: string): string[][] {
  return Array.from(searchQuery.matchAll(orGroupRegex)).map((orGroup) => orGroup[1].split(" ~ "));
}

export function parseTagGroups(searchQuery: string): { orGroups: string[][]; andTags: string[]; } {
  searchQuery = normalizeSearchQuery(searchQuery);
  return { andTags: parseAndTags(searchQuery), orGroups: parseOrGroups(searchQuery) };
}

export function buildTagGroup(tags: string[]): AbstractTag[] {
  return sortTagGroup(Array.from(new Set(tags)).map(tag => parseTag(tag)));
}

export function sortTagGroup(tags: AbstractTag[]): AbstractTag[] {
  return [...tags].sort((a, b) => a.cost - b.cost);
}

export function categorizeTags(tags: AbstractTag[]): CategorizedTags {
  const positiveTags: AbstractTag[] = [];
  const wildcardTags: WildcardTag[] = [];
  const metadataTags: MetadataTag[] = [];

  for (const tag of tags) {
    if (tag instanceof WildcardTag) {
      wildcardTags.push(tag);
    } else if (tag instanceof MetadataTag) {
      metadataTags.push(tag);
    } else if (!tag.negated) {
      positiveTags.push(tag);
    }
  }
  return { positiveTags, wildcardTags, metadataTags };
}
