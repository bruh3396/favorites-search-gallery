import { SearchTerm } from "@/core/domain/search/terms/search_term";
import { SearchQuery } from "@/core/domain/search/expressions/search_query";
import { desugarNestedOrGroups } from "@/core/domain/search/parsers/nested_or_group_desugarer";
import { parseSearchTerm } from "@/core/domain/search/parsers/search_term_parser";
import { removeExtraWhitespace } from "@/core/utils/string/string_utilities";

const orGroupRegex = /(?:^|\s+)\(\s+((?:\S+)(?:(?:\s+~\s+)\S+)*)\s+\)/g;
const meaninglessTerm = /^\**$/;

export function parseSearchQuery<Doc>(query: string): SearchQuery<Doc> {
  const termGroups = parseTermGroups(query);
  const andTerms = buildSearchTermGroup(termGroups.andTerms);
  const orGroups = termGroups.orGroups.map(buildSearchTermGroup);
  return normalizeSearchQuery<Doc>(andTerms, orGroups);
}

export function normalizeSearchQuery<Doc>(andTerms: SearchTerm[], orGroups: SearchTerm[][]): SearchQuery<Doc> {
  const flattenedAndTerms = [...andTerms];
  const multiTermOrGroups: SearchTerm[][] = [];

  for (const orGroup of orGroups) {
    const deduped = dedupe(orGroup);

    if (deduped.length === 1) {
      flattenedAndTerms.push(deduped[0]);
    } else {
      multiTermOrGroups.push(sortSearchTermGroup(deduped));
    }
  }
  return new SearchQuery<Doc>(sortSearchTermGroup(dedupe(flattenedAndTerms)), multiTermOrGroups.sort((a, b) => a.length - b.length));
}

export function parseTermGroups(normalized: string): { orGroups: string[][]; andTerms: string[] } {
  normalized = desugarNestedOrGroups(removeExtraWhitespace(normalized).toLowerCase());
  return { andTerms: parseAndTerms(normalized), orGroups: parseOrGroups(normalized) };
}

export function buildSearchTermGroup(terms: string[]): SearchTerm[] {
  return terms.map(parseSearchTerm);
}

export function sortSearchTermGroup(terms: SearchTerm[]): SearchTerm[] {
  return [...terms].sort((a, b) => a.cost - b.cost);
}

function dedupe(terms: SearchTerm[]): SearchTerm[] {
  const seen = new Set<string>();
  return terms.filter(term => !seen.has(term.literal) && seen.add(term.literal));
}

function parseAndTerms(query: string): string[] {
  return removeExtraWhitespace(query.replace(orGroupRegex, "")).split(" ").filter(term => !meaninglessTerm.test(term));
}

function parseOrGroups(query: string): string[][] {
  return [...query.matchAll(orGroupRegex)].map(orGroup => orGroup[1].split(" ~ "));
}
