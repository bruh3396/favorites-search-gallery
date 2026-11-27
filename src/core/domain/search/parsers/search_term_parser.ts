import { MetricSearchTerm } from "@/core/domain/search/terms/metric_search_term";
import { NumericSearchTerm } from "@/core/domain/search/terms/numeric_search_term";
import { SearchTerm } from "@/core/domain/search/terms/search_term";
import { parseExactSearchTerm } from "@/core/domain/search/parsers/exact_search_term_parser";
import { parseMetricComparison } from "@/core/domain/search/parsers/metric_comparison";
import { parseSearchTermNegation } from "@/core/domain/search/parsers/search_term_negation_parser";
import { parseWildcardSearchTerm } from "@/core/domain/search/parsers/wildcard_search_term_parser";

export function parseSearchTerm(term: string): SearchTerm {
  if (isNumericTerm(term)) {
    return parseNumericSearchTerm(term);
  }

  if (isWildcardTerm(term)) {
    return parseWildcardSearchTerm(term);
  }
  return parseMetricSearchTerm(term) ?? parseExactSearchTerm(term);
}

function parseNumericSearchTerm(term: string): NumericSearchTerm {
  const parsedTerm = parseSearchTermNegation(term);
  const value = Number(parsedTerm.value);
  return new NumericSearchTerm(parsedTerm, { metric: "id", comparator: ":", isRelative: false, rightHandMetric: "id", value, isTautological: false });
}

function parseMetricSearchTerm(term: string): MetricSearchTerm | null {
  const parsedTerm = parseSearchTermNegation(term);
  const metricComparison = parseMetricComparison(parsedTerm.value);
  return metricComparison === null ? null : new MetricSearchTerm(parsedTerm, metricComparison);
}

function isNumericTerm(term: string): boolean {
  return (/^-?\d+$/).test(term);
}

function isWildcardTerm(term: string): boolean {
  return term.includes("*");
}
