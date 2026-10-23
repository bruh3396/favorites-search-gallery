import { Metric } from "@/core/domain/post/post";

export type MetricComparator = ":" | ":<" | ":>";

export interface Searchable {
  readonly tags: ReadonlySet<string>;
}

export interface MetricSearchable extends Searchable {
  getMetric: (metric: Metric) => number;
}
