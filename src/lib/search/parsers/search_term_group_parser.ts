import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { parseSearchTerm } from "@/lib/search/parsers/search_term_parser";
import { removeExtraWhitespace } from "@/utils/pure/string";

const orGroupRegex = /(?:^|\s+)\(\s+((?:\S+)(?:(?:\s+~\s+)\S+)*)\s+\)/g;

export function normalizeSearchQuery(query: string): string {
  return removeExtraWhitespace(query).toLowerCase();
}

export function parseTermGroups(query: string): { orGroups: string[][]; andTerms: string[] } {
  query = normalizeSearchQuery(query);
  return { andTerms: parseAndTerms(query), orGroups: parseOrGroups(query) };
}

export function buildSearchTerms(terms: string[]): AbstractSearchTerm[] {
  return sortSearchTerms(Array.from(new Set(terms)).map(term => parseSearchTerm(term)));
}

export function sortSearchTerms(searchTerms: AbstractSearchTerm[]): AbstractSearchTerm[] {
  return [...searchTerms].sort((a, b) => a.cost - b.cost);
}

function parseAndTerms(query: string): string[] {
  return removeExtraWhitespace(query.replace(orGroupRegex, "")).split(" ").filter((term) => term !== "");
}

function parseOrGroups(query: string): string[][] {
  return Array.from(query.matchAll(orGroupRegex)).map((orGroup) => orGroup[1].split(" ~ "));
}
