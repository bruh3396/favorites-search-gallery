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
const metricComparisonRegex = new RegExp(`^(${metricPattern})(:[<>]?)(\\d+|${metricPattern})$`);

export function parseMetricComparison(term: string): MetricComparison | null {
  const match = metricComparisonRegex.exec(term);

  if (match === null) {
    return null;
  }
  const metric = match[1] as Metric;
  const metricComparator = match[2] as MetricComparator;
  const value = match[3];

  if (isMetric(value)) {
    return { metric, comparator: metricComparator, isRelative: true, rightHandMetric: value, value: 0, isTautological: metric === value };
  }
  return { metric, comparator: metricComparator, isRelative: false, rightHandMetric: "id", value: Number(value), isTautological: false };
}
