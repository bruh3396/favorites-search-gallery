export const METRICS = ["id", "score", "width", "height", "duration", "changedAt"] as const;
const metrics: ReadonlySet<unknown> = new Set(METRICS);

export type Metric = typeof METRICS[number];

export function isMetric(value: unknown): value is Metric {
  return metrics.has(value);
}
