import { AbstractSearchTerm } from "../terms/abstract_term";
import { CategorizedTags } from "../types/search_types";
import { MetadataSearchTerm } from "../terms/metadata_term";
import { WildcardSearchTerm } from "../terms/wildcard_term";
import { parseTag } from "./term_parser";
import { removeExtraWhiteSpace } from "../../../utils/string/format";

const orGroupRegex = /(?:^|\s+)\(\s+((?:\S+)(?:(?:\s+~\s+)\S+)*)\s+\)/g;

export function normalizeSearchQuery(query: string): string {
  return removeExtraWhiteSpace(query).toLowerCase();
}

function parseAndTags(query: string): string[] {
  return removeExtraWhiteSpace(query.replace(orGroupRegex, "")).split(" ").filter((tag) => tag !== "");
}

function parseOrGroups(query: string): string[][] {
  return Array.from(query.matchAll(orGroupRegex)).map((orGroup) => orGroup[1].split(" ~ "));
}

export function parseTagGroups(query: string): { orGroups: string[][]; andTags: string[]; } {
  query = normalizeSearchQuery(query);
  return { andTags: parseAndTags(query), orGroups: parseOrGroups(query) };
}

export function buildTagGroup(tags: string[]): AbstractSearchTerm[] {
  return sortTagGroup(Array.from(new Set(tags)).map(tag => parseTag(tag)));
}

export function sortTagGroup(tags: AbstractSearchTerm[]): AbstractSearchTerm[] {
  return [...tags].sort((a, b) => a.cost - b.cost);
}

export function categorizeTags(tags: AbstractSearchTerm[]): CategorizedTags {
  const positiveTags: AbstractSearchTerm[] = [];
  const wildcardTags: WildcardSearchTerm[] = [];
  const metadataTags: MetadataSearchTerm[] = [];

  for (const tag of tags) {
    if (tag instanceof WildcardSearchTerm) {
      wildcardTags.push(tag);
    } else if (tag instanceof MetadataSearchTerm) {
      metadataTags.push(tag);
    } else if (!tag.negated) {
      positiveTags.push(tag);
    }
  }
  return { positiveTags, wildcardTags, metadataTags };
}
