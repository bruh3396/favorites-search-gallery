import { MetricSearchable } from "@/core/domain/search/metric_searchable";

interface BenchmarkCase {
  readonly group: string;
  readonly name: string;
  readonly query: string;
}

const QUERYABLE_TAG = /^(?=.*[a-z])[a-z0-9_]{5,}$/;

export function createBenchmarkCases(metricSearchables: readonly MetricSearchable[]): BenchmarkCase[] {
  const tagCounts = new Map<string, number>();

  for (const metricSearchable of metricSearchables) {
    for (const tag of metricSearchable.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const countedTags = [...tagCounts].filter(([tag]) => QUERYABLE_TAG.test(tag));
  const scores = metricSearchables.map(metricSearchable => metricSearchable.getMetric("score")).sort((a, b) => b - a);
  const nearestTags = (share: number, count: number): string[] => {
    const target = metricSearchables.length * share;
    return countedTags.toSorted((a, b) => Math.abs(a[1] - target) - Math.abs(b[1] - target)).slice(0, count).map(([tag]) => tag);
  };
  const tag = (share: number): string => nearestTags(share, 1)[0] ?? "";
  const scoreAbove = (share: number): string => `score:>${scores[Math.min(scores.length - 1, Math.floor(scores.length * share))] ?? 0}`;
  const orGroup = (...terms: string[]): string => `( ${terms.join(" ~ ")} )`;
  const broad = tag(0.25);
  return [
    { group: "Single", name: "Broad", query: broad },
    { group: "Single", name: "Rare", query: tag(0.001) },
    { group: "Boolean", name: "And", query: `${broad} ${tag(0.05)}` },
    { group: "Boolean", name: "Or", query: orGroup(tag(0.001), tag(0.0005)) },
    { group: "Boolean", name: "Not", query: `${broad} -${tag(0.05)}` },
    { group: "Boolean", name: "Only Not", query: `-${broad}` },
    { group: "Boolean", name: "And Or Not", query: `${broad} ${orGroup(tag(0.05), tag(0.03))} -${tag(0.001)}` },
    { group: "Wildcards", name: "Prefix 2", query: `${broad.slice(0, 2)}*` },
    { group: "Wildcards", name: "Prefix 3", query: `${broad.slice(0, 3)}*` },
    { group: "Wildcards", name: "Prefix 5", query: `${broad.slice(0, 5)}*` },
    { group: "Wildcards", name: "Suffix", query: `*${broad.slice(-3)}` },
    { group: "Wildcards", name: "Contains", query: `*${broad.slice(1, 4)}*` },
    { group: "Wildcards", name: "Multi Star", query: `*${broad.slice(0, 2)}*${broad.slice(-2)}*` },
    { group: "Wildcards", name: "Multi Star Empty", query: `*${broad.slice(0, 2)}*qzxj*` },
    { group: "Metrics", name: "Score Broad", query: scoreAbove(0.5) },
    { group: "Metrics", name: "Score Medium", query: scoreAbove(0.05) },
    { group: "Metrics", name: "Score Rare", query: scoreAbove(0.001) },
    { group: "Metrics", name: "Relative", query: "width:>height" },
    { group: "Metrics", name: "Tag And Score", query: `${broad} ${scoreAbove(0.1)}` },
    ...[2, 6, 10, 50].map(count => ({ group: "Stress", name: `Or ${count}`, query: orGroup(...nearestTags(0.01, count)) })),
    {
      group: "Stress",
      name: "Or Groups",
      query: [[0.25, 0.05], [0.2, 0.03], [0.15, 0.02], [0.1, 0.01], [0.008, 0.001]].map(shares => orGroup(...shares.map(tag))).join(" ")
    },
    { group: "Stress", name: "Nested Or", query: `( ( ${broad} ${tag(0.2)} ) ~ ( ${tag(0.05)} ${tag(0.03)} ) )` },
    { group: "Stress", name: "Negation Tail", query: [broad, ...[0.2, 0.15, 0.1, 0.05, 0.03, 0.02, 0.01].map(share => `-${tag(share)}`)].join(" ") },
    { group: "Stress", name: "Tautology", query: orGroup(broad, `-${broad}`) }
  ];
}
