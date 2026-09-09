import { WildcardMatchType, WildcardSearchTerm } from "@/lib/search/terms/wildcard_search_term";
import { metricComparisonRegex, parseMetricComparison } from "@/lib/search/parsers/metric_comparison";
import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { ExactSearchTerm } from "@/lib/search/terms/exact_search_term";
import { MetricSearchTerm } from "@/lib/search/terms/metric_search_term";
import { escapeParentheses } from "@/utils/pure/string";

const unmatchableRegex = /^\b$/;

export function parseSearchTerm(term: string): AbstractSearchTerm {
  const canonical = asIdMetricTerm(term);
  return isWildcardTerm(canonical) ? parseWildcardSearchTerm(canonical) : isMetricTerm(canonical) ? parseMetricSearchTerm(canonical) : parseExactSearchTerm(canonical);
}

export function parseWildcardSearchTerm(term: string): WildcardSearchTerm {
  const { isNegated, value } = parseNegation(removeDuplicateAsterisks(term));
  return new WildcardSearchTerm(value, isNegated, chooseWildcardMatchType(value), buildWildcardRegex(value));
}

export function parseMetricSearchTerm(term: string): MetricSearchTerm {
  const { isNegated, value } = parseNegation(term);
  const comparison = parseMetricComparison(value);
  return new MetricSearchTerm(value, isNegated, comparison);
}

export function parseExactSearchTerm(term: string): ExactSearchTerm {
  const { isNegated, value } = parseNegation(term);
  return new ExactSearchTerm(value, isNegated);
}

export function isWildcardTerm(term: string): boolean {
  return term.includes("*");
}

export function isMetricTerm(term: string): boolean {
  return metricComparisonRegex.test(term);
}

function asIdMetricTerm(term: string): string {
  const { isNegated, value } = parseNegation(term);
  return (/^\d+$/).test(value) ? `${isNegated ? "-" : ""}id:${value}` : term;
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
