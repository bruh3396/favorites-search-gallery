import { MetricComparator, SearchableMetric } from "@/types/search";
import { isMetadataComparator, isSearchableMetadataMetric, searchableMetrics } from "@/types/guards";

export interface MetricComparison {
  readonly metric: SearchableMetric;
  readonly operator: MetricComparator;
  readonly isRelative: boolean;
  readonly rightHandMetric: SearchableMetric;
  readonly value: number;
  readonly isTautological: boolean;
}

const metricPattern = Array.from(searchableMetrics).join("|");

export const metricComparisonRegex: RegExp = new RegExp(`^-?(${metricPattern})(:[<>]?)(\\d+|${metricPattern})$`);

export function parseMetricComparison(term: string): MetricComparison {
  const { metric, operator, value } = extractExpression(term);

  if (isSearchableMetadataMetric(value)) {
    return {
      metric,
      operator,
      isRelative: true,
      rightHandMetric: value,
      value: 0,
      isTautological: metric === value
    };
  }
  return {
    metric,
    operator,
    isRelative: false,
    rightHandMetric: "id",
    value,
    isTautological: false
  };
}

function extractExpression(term: string): { metric: SearchableMetric; operator: MetricComparator; value: SearchableMetric | number } {
  const match = metricComparisonRegex.exec(term);

  if (match === null || match.length !== 4) {
    return {
      metric: "width",
      operator: ":",
      value: 0
    };
  }
  const metric = isSearchableMetadataMetric(match[1]) ? match[1] : "id";
  const operator = isMetadataComparator(match[2]) ? match[2] : ":";
  const value = isSearchableMetadataMetric(match[3]) ? match[3] : Number(match[3]);
  return { metric, operator, value };
}
