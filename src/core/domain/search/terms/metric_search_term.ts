import { MetricComparator } from "@/core/domain/search/metric_comparator";
import { MetricComparison } from "@/core/domain/search/parsers/metric_comparison";
import { MetricSearchable } from "@/core/domain/search/searchable";
import { ParsedTerm } from "@/core/domain/search/terms/parsed_term";
import { SearchTerm } from "@/core/domain/search/terms/search_term";

type Comparator = (a: number, b: number) => boolean;

const comparators: Record<MetricComparator, Comparator> = {
  ":": (a, b) => a === b,
  ":<": (a, b) => a < b,
  ":>": (a, b) => a > b
};

export class MetricSearchTerm extends SearchTerm {
  public readonly comparison: MetricComparison;
  protected override readonly baseCost: number = 0;
  private compare: Comparator;
  private rightValue: (metricSearchable: MetricSearchable) => number;
  private leftValue: (metricSearchable: MetricSearchable) => number;

  constructor(parsedTerm: ParsedTerm, metricComparison: MetricComparison) {
    super(parsedTerm);
    this.compare = comparators[metricComparison.comparator];
    this.leftValue = (metricSearchable): number => metricSearchable.getMetric(metricComparison.metric);
    this.rightValue = metricComparison.isRelative ? (metricSearchable): number => {
      return metricSearchable.getMetric(metricComparison.rightHandMetric);
    } : (): number => metricComparison.value;
    this.comparison = metricComparison;
  }

  protected override matchesPositive(metricSearchable: MetricSearchable): boolean {
    return this.compare(this.leftValue(metricSearchable), this.rightValue(metricSearchable));
  }

  protected override matchesNegated(metricSearchable: MetricSearchable): boolean {
    return !this.compare(this.leftValue(metricSearchable), this.rightValue(metricSearchable));
  }
}
