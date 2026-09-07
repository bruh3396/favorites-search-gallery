import { WildcardMatchType, WildcardSearchTerm } from "@/lib/search/terms/wildcard_search_term";
import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { ExactSearchTerm } from "@/lib/search/terms/exact_search_term";
import { MetricSearchExpression } from "@/lib/search/parsers/metric_search_expression";
import { MetricSearchTerm } from "@/lib/search/terms/metric_search_term";
import { escapeParentheses } from "@/utils/pure/string";

const unmatchableRegex = /^\b$/;

export function parseSearchTerm(term: string): AbstractSearchTerm {
  return isWildcardTerm(term) ? parseWildcardSearchTerm(term) : isMetricTerm(term) ? parseMetricSearchTerm(term) : parseExactSearchTerm(term);
}

export function parseWildcardSearchTerm(term: string): WildcardSearchTerm {
  const { isNegated, value } = parseNegation(removeDuplicateAsterisks(term));
  return new WildcardSearchTerm(value, isNegated, chooseWildcardMatchType(value), buildWildcardRegex(value));
}

export function parseMetricSearchTerm(term: string): MetricSearchTerm {
  const { isNegated, value } = parseNegation(term);
  const expression = new MetricSearchExpression(value);
  return new MetricSearchTerm(value, isNegated, expression);
}

export function parseExactSearchTerm(term: string): ExactSearchTerm {
  const { isNegated, value } = parseNegation(term);
  return new ExactSearchTerm(value, isNegated);
}

export function isWildcardTerm(term: string): boolean {
  return term.includes("*");
}

export function isMetricTerm(term: string): boolean {
  return MetricSearchExpression.regex.test(term);
}

function parseNegation(term: string): { isNegated: boolean; value: string } {
  const isNegated = term.startsWith("-") && term.length > 1;
  return { isNegated, value: isNegated ? term.substring(1) : term };
}

function chooseWildcardMatchType(value: string): WildcardMatchType {
  const first = value.indexOf("*");
  const last = value.lastIndexOf("*");
  const hasSingleStar = first === last;

  if (hasSingleStar && last === value.length - 1) {
    return WildcardMatchType.Prefix;
  }

  if (hasSingleStar && first === 0) {
    return WildcardMatchType.Suffix;
  }

  if (first === 0 && last === value.length - 1 && value.indexOf("*", 1) === last) {
    return WildcardMatchType.Substring;
  }
  return WildcardMatchType.MultiStar;
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
