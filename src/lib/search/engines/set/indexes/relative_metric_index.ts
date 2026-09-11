import { MetricComparison } from "@/lib/search/parsers/metric_comparison";
import { SearchableMetric } from "@/types/search";

const EMPTY: ReadonlySet<never> = new Set<never>();

export class RelativeMetricIndex<Doc> {
  private readonly sets: Map<string, Set<Doc>> = new Map<string, Set<Doc>>();
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
    this.sets.clear();

    for (let i = 0; i < this.metrics.length; i += 1) {
      for (let j = i + 1; j < this.metrics.length; j += 1) {
        this.buildPair(this.metrics[i], this.metrics[j], docs);
      }
    }
    this.built = true;
  }

  public add(doc: Doc): void {
    if (!this.built) {
      return;
    }

    for (let i = 0; i < this.metrics.length; i += 1) {
      for (let j = i + 1; j < this.metrics.length; j += 1) {
        this.placeInPair(doc, this.metrics[i], this.metrics[j]);
      }
    }
  }

  public remove(doc: Doc): void {
    if (!this.built) {
      return;
    }

    for (const set of this.sets.values()) {
      set.delete(doc);
    }
  }

  public docsFor(comparison: MetricComparison): ReadonlySet<Doc> {
    return this.sets.get(this.key(comparison.metric, comparison.operator, comparison.rightHandMetric)) ?? EMPTY;
  }

  private buildPair(left: SearchableMetric, right: SearchableMetric, docs: ReadonlySet<Doc>): void {
    const greater = new Set<Doc>();
    const less = new Set<Doc>();
    const equal = new Set<Doc>();

    for (const doc of docs) {
      this.partition(doc, left, right, greater, less, equal);
    }
    this.aliasPair(left, right, greater, less, equal);
  }

  private placeInPair(doc: Doc, left: SearchableMetric, right: SearchableMetric): void {
    this.partition(
      doc,
      left,
      right,
      this.sets.get(this.key(left, ":>", right)) as Set<Doc>,
      this.sets.get(this.key(left, ":<", right)) as Set<Doc>,
      this.sets.get(this.key(left, ":", right)) as Set<Doc>
    );
  }

  private partition(doc: Doc, left: SearchableMetric, right: SearchableMetric, greater: Set<Doc>, less: Set<Doc>, equal: Set<Doc>): void {
    const leftValue = this.metricFor(doc, left);
    const rightValue = this.metricFor(doc, right);

    if (leftValue > rightValue) {
      greater.add(doc);
    } else if (leftValue < rightValue) {
      less.add(doc);
    } else {
      equal.add(doc);
    }
  }

  private aliasPair(left: SearchableMetric, right: SearchableMetric, greater: Set<Doc>, less: Set<Doc>, equal: Set<Doc>): void {
    this.sets.set(this.key(left, ":>", right), greater);
    this.sets.set(this.key(right, ":<", left), greater);
    this.sets.set(this.key(left, ":<", right), less);
    this.sets.set(this.key(right, ":>", left), less);
    this.sets.set(this.key(left, ":", right), equal);
    this.sets.set(this.key(right, ":", left), equal);
  }

  private key(left: SearchableMetric, operator: string, right: SearchableMetric): string {
    return `${left}${operator}${right}`;
  }
}
