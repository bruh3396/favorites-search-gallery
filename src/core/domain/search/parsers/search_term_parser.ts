import { SearchTerm } from "@/core/domain/search/terms/search_term";
import { ParsedTerm } from "@/core/domain/search/terms/parsed_term";
import { WildcardMatchType } from "@/core/domain/search/terms/wildcard_match_type";
import { WildcardSearchTerm } from "@/core/domain/search/terms/wildcard_search_term";
import { metricComparisonRegex, parseMetricComparison } from "@/core/domain/search/parsers/metric_comparison";
import { ExactSearchTerm } from "@/core/domain/search/terms/exact_search_term";
import { MetricSearchTerm } from "@/core/domain/search/terms/metric_search_term";
import { NumericSearchTerm } from "@/core/domain/search/terms/numeric_search_term";
import { escapeParentheses } from "@/core/utils/string/string_utilities";

const unmatchableRegex = /^\b$/;

export function parseSearchTerm(term: string): SearchTerm {
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
  const parsedTerm = parseNegation(term);
  return new NumericSearchTerm(parsedTerm, parseMetricComparison(`id:${parsedTerm.value}`));
}

export function parseWildcardSearchTerm(term: string): WildcardSearchTerm {
  const parsedTerm = parseNegation(removeDuplicateAsterisks(term));
  return new WildcardSearchTerm(parsedTerm, { matchType: chooseWildcardMatchType(parsedTerm.value), regex: buildWildcardRegex(parsedTerm.value) });
}

export function parseMetricSearchTerm(term: string): MetricSearchTerm {
  const parsedTerm = parseNegation(term);
  return new MetricSearchTerm(parsedTerm, parseMetricComparison(parsedTerm.value));
}

export function parseExactSearchTerm(term: string): ExactSearchTerm {
  return new ExactSearchTerm(parseNegation(term));
}

function isNumericTerm(term: string): boolean {
  return (/^-?\d+$/).test(term);
}

function isWildcardTerm(term: string): boolean {
  return term.includes("*");
}

function isMetricTerm(term: string): boolean {
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
