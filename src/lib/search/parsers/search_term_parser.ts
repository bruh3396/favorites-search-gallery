import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { ExactSearchTerm } from "@/lib/search/terms/exact_search_term";
import { MetadataSearchExpression } from "@/lib/search/parsers/metadata_search_expression";
import { MetadataSearchTerm } from "@/lib/search/terms/metadata_search_term";
import { WildcardMatchType } from "@/lib/search/wildcard_match_type";
import { WildcardSearchTerm } from "@/lib/search/terms/wildcard_search_term";
import { escapeParentheses } from "@/utils/pure/string";

const unmatchableRegex = /^\b$/;
const startsWithRegex = /^[^*]*\*$/;
const containsRegex = /^\*[^*]*\*$/;

export function parseSearchTerm(term: string): AbstractSearchTerm {
  return isWildcardTerm(term) ? parseWildcardSearchTerm(term) : isMetadataTerm(term) ? parseMetadataSearchTerm(term) : parseExactSearchTerm(term);
}

export function parseWildcardSearchTerm(term: string): WildcardSearchTerm {
  const { isNegated, value } = parseNegation(removeDuplicateAsterisks(term));
  return new WildcardSearchTerm(value, isNegated, chooseWildcardMatchType(value), buildWildcardRegex(value));
}

export function parseMetadataSearchTerm(term: string): MetadataSearchTerm {
  const { isNegated, value } = parseNegation(term);
  const expression = new MetadataSearchExpression(value);
  return new MetadataSearchTerm(value, isNegated, expression);
}

export function parseExactSearchTerm(term: string): ExactSearchTerm {
  const { isNegated, value } = parseNegation(term);
  return new ExactSearchTerm(value, isNegated);
}

export function isWildcardTerm(term: string): boolean {
  return term.includes("*");
}

export function isMetadataTerm(term: string): boolean {
  return MetadataSearchExpression.regex.test(term);
}

export function hasMetadataTerm(query: string): boolean {
  return query.trim().split(/\s+/).some(isMetadataTerm);
}

function parseNegation(term: string): { isNegated: boolean; value: string } {
  const isNegated = term.startsWith("-") && term.length > 1;
  return { isNegated, value: isNegated ? term.substring(1) : term };
}

function chooseWildcardMatchType(value: string): WildcardMatchType {
  return startsWithRegex.test(value) ? WildcardMatchType.Prefix : containsRegex.test(value) ? WildcardMatchType.Substring : WildcardMatchType.Regex;
}

function buildWildcardRegex(value: string): RegExp {
  try {
    const regex = escapeParentheses(value.replace(/\*/g, ".*"));
    return new RegExp(`^${regex}$`);
  } catch {
    return unmatchableRegex;
  }
}

function removeDuplicateAsterisks(value: string): string {
  return value.replace(/\*+/g, "*");
}
