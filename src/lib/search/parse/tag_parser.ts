import { AbstractTag } from "../tags/abstract_tag";
import { ExactTag } from "../tags/exact_tag";
import { MetadataSearchExpression } from "../types/metadata_search_expression";
import { MetadataTag } from "../tags/metadata_tag";
import { WildcardMatchType } from "../types/search_types";
import { WildcardTag } from "../tags/wildcard_tag";
import { escapeParenthesis } from "../../../utils/string/format";

const unmatchableRegex = /^\b$/;
const startsWithRegex = /^[^*]*\*$/;
const containsRegex = /^\*[^*]*\*$/;

export function parseTag(tag: string): AbstractTag {
  return isWildcardTag(tag) ? parseWildcardTag(tag) : isMetadataTag(tag) ? parseMetadataTag(tag) : parseExactTag(tag);
}

export function parseExactTag(tag: string): ExactTag {
  const { negated, value } = parseNegation(tag);
  return new ExactTag(value, negated);
}

export function parseWildcardTag(tag: string): WildcardTag {
  const { negated, value } = parseNegation(removeDuplicateAsterisks(tag));
  return new WildcardTag(value, negated, getMatchType(value), buildWildcardRegex(value));
}

export function parseMetadataTag(tag: string): MetadataTag {
  const { negated, value } = parseNegation(tag);
  const expression = new MetadataSearchExpression(value);
  return new MetadataTag(value, negated, expression);
}

export function isWildcardTag(tag: string): boolean {
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
  return startsWithRegex.test(value) ? WildcardMatchType.PREFIX : containsRegex.test(value) ? WildcardMatchType.INCLUDES : WildcardMatchType.REGEX;
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
