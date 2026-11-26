import { Metric } from "@/core/domain/search/metric";
import { Searchable } from "@/core/domain/search/searchable";

export interface MetricSearchable extends Searchable {
  getMetric: (metric: Metric) => number;
}
