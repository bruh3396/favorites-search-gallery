import { MetricSearchComparison } from "@/lib/search/parsers/metric_search_comparison";
import { SearchableMetric } from "@/types/search";
import { findFirstIndexWhere } from "@/utils/pure/array";

type AbsoluteComparison = Pick<MetricSearchComparison, "metric" | "operator" | "value">;

interface Entry<Doc> {
  value: number;
  doc: Doc;
}

export class MetricIndex<Doc> {
  private readonly entriesByMetric: Map<SearchableMetric, Entry<Doc>[]> = new Map<SearchableMetric, Entry<Doc>[]>();
  private built = false;

  constructor(
    private readonly metrics: readonly SearchableMetric[],
    private readonly metricFor: (doc: Doc, metric: SearchableMetric) => number
  ) { }

  public ensureBuilt(docs: ReadonlySet<Doc>): void {
    if (!this.built) {
      this.build(docs);
    }
  }

  public build(docs: ReadonlySet<Doc>): void {
    for (const metric of this.metrics) {
      const entries: Entry<Doc>[] = [];

      for (const doc of docs) {
        entries.push({ value: this.metricFor(doc, metric), doc });
      }
      entries.sort((a, b) => a.value - b.value);
      this.entriesByMetric.set(metric, entries);
    }
    this.built = true;
  }

  public add(doc: Doc): void {
    if (!this.built) {
      return;
    }

    for (const metric of this.metrics) {
      const entries = this.entriesByMetric.get(metric);

      if (entries !== undefined) {
        const value = this.metricFor(doc, metric);

        entries.splice(this.lowerBound(entries, value), 0, { value, doc });
      }
    }
  }

  public remove(doc: Doc): void {
    for (const metric of this.metrics) {
      const entries = this.entriesByMetric.get(metric);

      if (entries !== undefined) {
        const index = this.indexOfDoc(entries, this.metricFor(doc, metric), doc);

        if (index !== -1) {
          entries.splice(index, 1);
        }
      }
    }
  }

  public docsMatching(comparison: AbsoluteComparison): ReadonlySet<Doc> {
    const { entries, start, end } = this.matchingRange(comparison);
    const docs = new Set<Doc>();

    for (let index = start; index < end; index += 1) {
      docs.add(entries[index].doc);
    }
    return docs;
  }

  private matchingRange(comparison: AbsoluteComparison): { entries: Entry<Doc>[]; start: number; end: number } {
    const entries = this.entriesByMetric.get(comparison.metric) ?? [];

    switch (comparison.operator) {
      case ":<":
        return { entries, start: 0, end: this.lowerBound(entries, comparison.value) };
      case ":>":
        return { entries, start: this.upperBound(entries, comparison.value), end: entries.length };
      default:
        return { entries, start: this.lowerBound(entries, comparison.value), end: this.upperBound(entries, comparison.value) };
    }
  }

  private lowerBound(entries: Entry<Doc>[], value: number): number {
    return findFirstIndexWhere(entries.length, index => entries[index].value >= value);
  }

  private upperBound(entries: Entry<Doc>[], value: number): number {
    return findFirstIndexWhere(entries.length, index => entries[index].value > value);
  }

  private indexOfDoc(entries: Entry<Doc>[], value: number, doc: Doc): number {
    for (let index = this.lowerBound(entries, value); index < entries.length && entries[index].value === value; index += 1) {
      if (entries[index].doc === doc) {
        return index;
      }
    }
    return -1;
  }
}
