import { AbstractSearchTag } from "./abstract_search_tag";
import { ExactSearchTag } from "./exact_search_tag";
import { MetadataSearchExpression } from "../type/metadata_search_expression";
import { MetadataSearchTag } from "./metadata_search_tag";
import { WildcardMatchType } from "../type/search_types";
import { WildcardSearchTag } from "./wildcard_search_tag";
import { escapeParenthesis } from "../../../utils/string/format";

const unmatchableRegex = /^\b$/;
const startsWithRegex = /^[^*]*\*$/;
const containsRegex = /^\*[^*]*\*$/;

function removeDuplicateAsterisks(value: string): string {
  return value.replace(/\*+/g, "*");
}

function buildWildcardRegex(value: string): RegExp {
  try {
    const regex = escapeParenthesis(value.replace(/\*/g, ".*"));
    return new RegExp(`^${regex}$`);
  } catch {
    return unmatchableRegex;
  }
}

function getMatchType(value: string): WildcardMatchType {
  return startsWithRegex.test(value) ? WildcardMatchType.PREFIX : containsRegex.test(value) ? WildcardMatchType.CONTAINS : WildcardMatchType.REGEX;
}

function parseNegation(tag: string): { negated: boolean; value: string; } {
  const negated = tag.startsWith("-") && tag.length > 1;
  return { negated, value: negated ? tag.substring(1) : tag };
}

export function parseExactSearchTag(tag: string): ExactSearchTag {
  const { negated, value } = parseNegation(tag);
  return new ExactSearchTag(value, negated);
}

export function parseWildcardSearchTag(tag: string): WildcardSearchTag {
  const { negated, value } = parseNegation(removeDuplicateAsterisks(tag));
  return new WildcardSearchTag(value, negated, getMatchType(value), buildWildcardRegex(value), value.slice(0, -1), value.slice(1, -1));
}

export function parseMetadataSearchTag(tag: string): MetadataSearchTag {
  const { negated, value } = parseNegation(tag);
  const expression = new MetadataSearchExpression(value);
  return new MetadataSearchTag(value, negated, expression);
}

export function isWildcardSearchTag(tag: string): boolean {
  return tag.includes("*");
}

export function isMetadataSearchTag(tag: string): boolean {
  return MetadataSearchExpression.regex.test(tag);
}

export function parseSearchTag(tag: string): AbstractSearchTag {
  return isWildcardSearchTag(tag) ? parseWildcardSearchTag(tag) : isMetadataSearchTag(tag) ? parseMetadataSearchTag(tag) : parseExactSearchTag(tag);
}
