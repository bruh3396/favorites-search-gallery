import { ExactSearchTerm } from "@/core/domain/search/terms/exact_search_term";
import { MetricSearchTerm } from "@/core/domain/search/terms/metric_search_term";
import { NumericSearchTerm } from "@/core/domain/search/terms/numeric_search_term";
import { ParsedTerm } from "@/core/domain/search/terms/parsed_term";
import { SearchTerm } from "@/core/domain/search/terms/search_term";
import { WildcardMatchType } from "@/core/domain/search/terms/wildcard_match_type";
import { WildcardSearchTerm } from "@/core/domain/search/terms/wildcard_search_term";
import { escapeParentheses } from "@/core/utils/string/string_utilities";
import { parseMetricComparison } from "@/core/domain/search/parsers/metric_comparison";

const unmatchableRegex = /^\b$/;

export function parseSearchTerm(term: string): SearchTerm {
  if (isNumericTerm(term)) {
    return parseNumericSearchTerm(term);
  }

  if (isWildcardTerm(term)) {
    return parseWildcardSearchTerm(term);
  }
  return parseMetricSearchTerm(term) ?? parseExactSearchTerm(term);
}

export function parseNumericSearchTerm(term: string): NumericSearchTerm {
  const parsedTerm = parseSearchTermNegation(term);
  const value = Number(parsedTerm.value);
  return new NumericSearchTerm(parsedTerm, { metric: "id", comparator: ":", isRelative: false, rightHandMetric: "id", value, isTautological: false });
}

export function parseWildcardSearchTerm(term: string): WildcardSearchTerm {
  const parsedTerm = parseSearchTermNegation(removeDuplicateAsterisks(term));
  return new WildcardSearchTerm(parsedTerm, { matchType: chooseWildcardMatchType(parsedTerm.value), regex: buildWildcardRegex(parsedTerm.value) });
}

export function parseMetricSearchTerm(term: string): MetricSearchTerm | null {
  const parsedTerm = parseSearchTermNegation(term);
  const metricComparison = parseMetricComparison(parsedTerm.value);
  return metricComparison === null ? null : new MetricSearchTerm(parsedTerm, metricComparison);
}

export function parseExactSearchTerm(term: string): ExactSearchTerm {
  return new ExactSearchTerm(parseSearchTermNegation(term));
}

function isNumericTerm(term: string): boolean {
  return (/^-?\d+$/).test(term);
}

function isWildcardTerm(term: string): boolean {
  return term.includes("*");
}

export function parseSearchTermNegation(term: string): ParsedTerm {
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
