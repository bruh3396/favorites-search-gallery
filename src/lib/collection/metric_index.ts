import { MetricComparison } from "@/lib/search/terms/metric_search_term";
import { SearchableMetric } from "@/types/search";
import { findFirstIndexWhere } from "@/utils/pure/array";

interface Entry<Doc> {
  value: number;
  doc: Doc;
}

export class MetricIndex<Doc> {
  private readonly entriesByMetric: Map<SearchableMetric, Entry<Doc>[]> = new Map<SearchableMetric, Entry<Doc>[]>();

  constructor(
    private readonly metrics: readonly SearchableMetric[],
    private readonly metricFor: (doc: Doc, metric: SearchableMetric) => number
  ) { }

  public build(docs: ReadonlySet<Doc>): void {
    for (const metric of this.metrics) {
      const entries: Entry<Doc>[] = [];

      for (const doc of docs) {
        entries.push({ value: this.metricFor(doc, metric), doc });
      }
      entries.sort((a, b) => a.value - b.value);
      this.entriesByMetric.set(metric, entries);
    }
  }

  public add(doc: Doc): void {
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

  public docsMatching(comparison: MetricComparison): Doc[] {
    const entries = this.entriesByMetric.get(comparison.metric) ?? [];

    switch (comparison.operator) {
      case ":<":
        return this.slice(entries, 0, this.lowerBound(entries, comparison.value));
      case ":>":
        return this.slice(entries, this.upperBound(entries, comparison.value), entries.length);
      default:
        return this.slice(entries, this.lowerBound(entries, comparison.value), this.upperBound(entries, comparison.value));
    }
  }

  private lowerBound(entries: Entry<Doc>[], value: number): number {
    return findFirstIndexWhere(entries.length, index => entries[index].value >= value);
  }

  private upperBound(entries: Entry<Doc>[], value: number): number {
    return findFirstIndexWhere(entries.length, index => entries[index].value > value);
  }

  private slice(entries: Entry<Doc>[], start: number, end: number): Doc[] {
    return entries.slice(start, end).map(entry => entry.doc);
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
