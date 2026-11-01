import { SearchTerm } from "@/core/domain/search/terms/search_term";
import { SearchQuery } from "@/core/domain/search/expressions/search_query";
import { desugarNestedOrGroups } from "@/core/domain/search/parsers/nested_or_group_desugarer";
import { parseSearchTerm } from "@/core/domain/search/parsers/search_term_parser";
import { removeExtraWhitespace } from "@/core/utils/string/string_utilities";

const orGroupRegex = /(?:^|\s+)\(\s+((?:\S+)(?:(?:\s+~\s+)\S+)*)\s+\)/g;
const meaninglessTerm = /^\**$/;

export function parseSearchQuery<Doc>(query: string): SearchQuery<Doc> {
  const termGroups = parseTermGroups(query);
  const searchTerms = buildSearchTermGroup(termGroups.andTerms);
  const orGroups = termGroups.orGroups.map(buildSearchTermGroup);
  return normalizeSearchQuery<Doc>(searchTerms, orGroups);
}

function normalizeSearchQuery<Doc>(andSearchTerms: SearchTerm[], orGroups: SearchTerm[][]): SearchQuery<Doc> {
  const flattenedAndSearchTerms = [...andSearchTerms];
  const multiTermOrGroups: SearchTerm[][] = [];

  for (const orGroupSearchTerms of orGroups) {
    const dedupedSearchTerms = dedupe(orGroupSearchTerms);

    if (dedupedSearchTerms.length === 1) {
      flattenedAndSearchTerms.push(dedupedSearchTerms[0]);
    } else {
      multiTermOrGroups.push(sortSearchTermGroup(dedupedSearchTerms));
    }
  }
  return new SearchQuery<Doc>(sortSearchTermGroup(dedupe(flattenedAndSearchTerms)), multiTermOrGroups.sort((a, b) => a.length - b.length));
}

function parseTermGroups(normalized: string): { orGroups: string[][]; andTerms: string[] } {
  normalized = desugarNestedOrGroups(removeExtraWhitespace(normalized).toLowerCase());
  return { andTerms: parseAndTerms(normalized), orGroups: parseOrGroups(normalized) };
}

function buildSearchTermGroup(terms: string[]): SearchTerm[] {
  return terms.map(parseSearchTerm);
}

function sortSearchTermGroup(searchTerms: SearchTerm[]): SearchTerm[] {
  return [...searchTerms].sort((a, b) => a.cost - b.cost);
}

function dedupe(searchTerms: SearchTerm[]): SearchTerm[] {
  const seen = new Set<string>();
  return searchTerms.filter(searchTerm => !seen.has(searchTerm.literal) && seen.add(searchTerm.literal));
}

function parseAndTerms(query: string): string[] {
  return removeExtraWhitespace(query.replace(orGroupRegex, "")).split(" ").filter(term => !meaninglessTerm.test(term));
}

function parseOrGroups(query: string): string[][] {
  return [...query.matchAll(orGroupRegex)].map(orGroup => orGroup[1].split(" ~ "));
}
