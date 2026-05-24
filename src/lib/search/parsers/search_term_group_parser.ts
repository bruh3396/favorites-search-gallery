import { AbstractSearchTerm } from "../terms/abstract_search_term";
import { CategorizedSearchTerms } from "../types/search_types";
import { MetadataSearchTerm } from "../terms/metadata_search_term";
import { WildcardSearchTerm } from "../terms/wildcard_search_term";
import { parseSearchTerm } from "./search_term_parser";
import { removeExtraWhiteSpace } from "../../../utils/string/format";

const orGroupRegex = /(?:^|\s+)\(\s+((?:\S+)(?:(?:\s+~\s+)\S+)*)\s+\)/g;

export function normalizeSearchQuery(query: string): string {
  return removeExtraWhiteSpace(query).toLowerCase();
}

function parseAndTerms(query: string): string[] {
  return removeExtraWhiteSpace(query.replace(orGroupRegex, "")).split(" ").filter((term) => term !== "");
}

function parseOrGroups(query: string): string[][] {
  return Array.from(query.matchAll(orGroupRegex)).map((orGroup) => orGroup[1].split(" ~ "));
}

export function parseTermGroups(query: string): { orGroups: string[][]; andTerms: string[]; } {
  query = normalizeSearchQuery(query);
  return { andTerms: parseAndTerms(query), orGroups: parseOrGroups(query) };
}

export function buildSearchTerms(terms: string[]): AbstractSearchTerm[] {
  return sortSearchTerms(Array.from(new Set(terms)).map(term => parseSearchTerm(term)));
}

export function sortSearchTerms(searchTerms: AbstractSearchTerm[]): AbstractSearchTerm[] {
  return [...searchTerms].sort((a, b) => a.cost - b.cost);
}

export function categorizeSearchTerms(searchTerms: AbstractSearchTerm[]): CategorizedSearchTerms {
  const required: AbstractSearchTerm[] = [];
  const wildcard: WildcardSearchTerm[] = [];
  const metadata: MetadataSearchTerm[] = [];

  for (const searchTerm of searchTerms) {
    if (searchTerm instanceof WildcardSearchTerm) {
      wildcard.push(searchTerm);
    } else if (searchTerm instanceof MetadataSearchTerm) {
      metadata.push(searchTerm);
    } else if (!searchTerm.negated) {
      required.push(searchTerm);
    }
  }
  return { required, wildcard, metadata };
}
