import { MetricComparator, MetricSearchable } from "@/types/search";
import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { MetricComparison } from "@/lib/search/parsers/metric_comparison";

type Comparator = (a: number, b: number) => boolean;

const comparators: Record<MetricComparator, Comparator> = {
  ":": (a, b) => a === b,
  ":<": (a, b) => a < b,
  ":>": (a, b) => a > b
};

export class MetricSearchTerm extends AbstractSearchTerm {
  public readonly comparison: MetricComparison;
  protected override readonly baseCost: number = 0;
  private compare: Comparator;
  private rightValue: (item: MetricSearchable) => number;
  private leftValue: (item: MetricSearchable) => number;

  constructor(value: string, isNegated: boolean, comparison: MetricComparison) {
    super(value, isNegated);
    this.compare = comparators[comparison.operator];
    this.leftValue = (item): number => item.getMetric(comparison.metric);
    this.rightValue = comparison.isRelative ? (item): number => item.getMetric(comparison.rightHandMetric) : (): number => comparison.value;
    this.comparison = comparison;
  }

  protected override matchesPositive(item: MetricSearchable): boolean {
    return this.compare(this.leftValue(item), this.rightValue(item));
  }

  protected override matchesNegated(item: MetricSearchable): boolean {
    return !this.compare(this.leftValue(item), this.rightValue(item));
  }
}
