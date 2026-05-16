import { AbstractSearchTerm } from "../terms/abstract_term";
import { ExactSearchTerm } from "../terms/exact_term";
import { MetadataSearchExpression } from "../types/metadata_search_expression";
import { MetadataSearchTerm } from "../terms/metadata_term";
import { WildcardMatchType } from "../types/search_types";
import { WildcardSearchTerm } from "../terms/wildcard_term";
import { escapeParenthesis } from "../../../utils/string/format";

const unmatchableRegex = /^\b$/;
const startsWithRegex = /^[^*]*\*$/;
const containsRegex = /^\*[^*]*\*$/;

export function parseTag(tag: string): AbstractSearchTerm {
  return isWildcardTerm(tag) ? parseWildcardTag(tag) : isMetadataTag(tag) ? parseMetadataTag(tag) : parseExactTag(tag);
}

export function parseExactTag(tag: string): ExactSearchTerm {
  const { negated, value } = parseNegation(tag);
  return new ExactSearchTerm(value, negated);
}

export function parseWildcardTag(tag: string): WildcardSearchTerm {
  const { negated, value } = parseNegation(removeDuplicateAsterisks(tag));
  return new WildcardSearchTerm(value, negated, getMatchType(value), buildWildcardRegex(value));
}

export function parseMetadataTag(tag: string): MetadataSearchTerm {
  const { negated, value } = parseNegation(tag);
  const expression = new MetadataSearchExpression(value);
  return new MetadataSearchTerm(value, negated, expression);
}

export function isWildcardTerm(tag: string): boolean {
  return tag.includes("*");
}

export function isMetadataTag(tag: string): boolean {
  return MetadataSearchExpression.regex.test(tag);
}

function parseNegation(tag: string): { negated: boolean; value: string; } {
  const negated = tag.startsWith("-") && tag.length > 1;
  return { negated, value: negated ? tag.substring(1) : tag };
}

function getMatchType(value: string): WildcardMatchType {
  return startsWithRegex.test(value) ? WildcardMatchType.Prefix : containsRegex.test(value) ? WildcardMatchType.Includes : WildcardMatchType.Regex;
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
