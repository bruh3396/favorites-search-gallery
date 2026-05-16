import { AbstractSearchTerm } from "../terms/abstract_search_term";
import { ExactSearchTerm } from "../terms/exact_search_term";
import { MetadataSearchExpression } from "../types/metadata_search_expression";
import { MetadataSearchTerm } from "../terms/metadata_search_term";
import { WildcardMatchType } from "../types/search_types";
import { WildcardSearchTerm } from "../terms/wildcard_search_term";
import { escapeParenthesis } from "../../../utils/string/format";

const unmatchableRegex = /^\b$/;
const startsWithRegex = /^[^*]*\*$/;
const containsRegex = /^\*[^*]*\*$/;

export function parseSearchTerm(term: string): AbstractSearchTerm {
  return isWildcardTerm(term) ? parseWildcardSearchTerm(term) : isMetadataTerm(term) ? parseMetadataSearchTerm(term) : parseExactSearchTerm(term);
}

export function parseWildcardSearchTerm(term: string): WildcardSearchTerm {
  const { negated, value } = parseNegation(removeDuplicateAsterisks(term));
  return new WildcardSearchTerm(value, negated, chooseWildcardMatchType(value), buildWildcardRegex(value));
}

export function parseMetadataSearchTerm(term: string): MetadataSearchTerm {
  const { negated, value } = parseNegation(term);
  const expression = new MetadataSearchExpression(value);
  return new MetadataSearchTerm(value, negated, expression);
}

export function parseExactSearchTerm(term: string): ExactSearchTerm {
  const { negated, value } = parseNegation(term);
  return new ExactSearchTerm(value, negated);
}

export function isWildcardTerm(term: string): boolean {
  return term.includes("*");
}

export function isMetadataTerm(term: string): boolean {
  return MetadataSearchExpression.regex.test(term);
}

function parseNegation(term: string): { negated: boolean; value: string; } {
  const negated = term.startsWith("-") && term.length > 1;
  return { negated, value: negated ? term.substring(1) : term };
}

function chooseWildcardMatchType(value: string): WildcardMatchType {
  return startsWithRegex.test(value) ? WildcardMatchType.Prefix : containsRegex.test(value) ? WildcardMatchType.Substring : WildcardMatchType.Regex;
}

function buildWildcardRegex(value: string): RegExp {
  try {
    const regex = escapeParenthesis(value.replace(/\*/g, ".*"));
    return new RegExp(`^${regex}$`);
  } catch {
    return unmatchableRegex;
  }
}

function removeDuplicateAsterisks(value: string): string {
  return value.replace(/\*+/g, "*");
}
