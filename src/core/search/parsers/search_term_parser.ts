import { AbstractSearchTerm, ParsedTerm } from "@/core/search/terms/abstract_search_term";
import { WildcardMatchType, WildcardSearchTerm } from "@/core/search/terms/wildcard_search_term";
import { metricComparisonRegex, parseMetricComparison } from "@/core/search/parsers/metric_comparison";
import { ExactSearchTerm } from "@/core/search/terms/exact_search_term";
import { MetricSearchTerm } from "@/core/search/terms/metric_search_term";
import { NumericSearchTerm } from "@/core/search/terms/numeric_search_term";
import { escapeParentheses } from "@/core/utils/string/string";

const unmatchableRegex = /^\b$/;

export function parseSearchTerm(term: string): AbstractSearchTerm {
  if (isNumericTerm(term)) {
    return parseNumericSearchTerm(term);
  }

  if (isWildcardTerm(term)) {
    return parseWildcardSearchTerm(term);
  }

  if (isMetricTerm(term)) {
    return parseMetricSearchTerm(term);
  }
  return parseExactSearchTerm(term);
}

export function parseNumericSearchTerm(term: string): NumericSearchTerm {
  const parsed = parseNegation(term);
  return new NumericSearchTerm(parsed, parseMetricComparison(`id:${parsed.value}`));
}

export function parseWildcardSearchTerm(term: string): WildcardSearchTerm {
  const parsed = parseNegation(removeDuplicateAsterisks(term));
  return new WildcardSearchTerm(parsed, { matchType: chooseWildcardMatchType(parsed.value), regex: buildWildcardRegex(parsed.value) });
}

export function parseMetricSearchTerm(term: string): MetricSearchTerm {
  const parsed = parseNegation(term);
  return new MetricSearchTerm(parsed, parseMetricComparison(parsed.value));
}

export function parseExactSearchTerm(term: string): ExactSearchTerm {
  return new ExactSearchTerm(parseNegation(term));
}

export function isNumericTerm(term: string): boolean {
  return (/^-?\d+$/).test(term);
}

export function isWildcardTerm(term: string): boolean {
  return term.includes("*");
}

export function isMetricTerm(term: string): boolean {
  return metricComparisonRegex.test(term);
}

function parseNegation(term: string): ParsedTerm {
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
