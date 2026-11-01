import { METRICS, Metric, isMetric } from "@/core/domain/search/metric";
import { MetricComparator } from "@/core/domain/search/metric_comparator";

export interface MetricComparison {
  readonly metric: Metric;
  readonly comparator: MetricComparator;
  readonly rightHandMetric: Metric;
  readonly value: number;
  readonly isRelative: boolean;
  readonly isTautological: boolean;
}

const metricPattern = METRICS.join("|");

export const metricComparisonRegex: RegExp = new RegExp(`^-?(${metricPattern})(:[<>]?)(\\d+|${metricPattern})$`);

export function parseMetricComparison(term: string): MetricComparison {
  const { metric, metricComparator, value } = extractExpression(term);

  if (isMetric(value)) {
    return {
      metric,
      comparator: metricComparator,
      isRelative: true,
      rightHandMetric: value,
      value: 0,
      isTautological: metric === value
    };
  }
  return {
    metric,
    comparator: metricComparator,
    isRelative: false,
    rightHandMetric: "id",
    value,
    isTautological: false
  };
}

function extractExpression(term: string): { metric: Metric; metricComparator: MetricComparator; value: Metric | number } {
  const match = metricComparisonRegex.exec(term);

  if (match === null || match.length !== 4) {
    return {
      metric: "width",
      metricComparator: ":",
      value: 0
    };
  }
  const metric = match[1] as Metric;
  const metricComparator = match[2] as MetricComparator;
  const value = isMetric(match[3]) ? match[3] : Number(match[3]);
  return { metric, metricComparator, value };
}
