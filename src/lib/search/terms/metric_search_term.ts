import { MetricComparator, MetricSearchable, SearchableMetric } from "@/types/search";
import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { MetricSearchExpression } from "@/lib/search/parsers/metric_search_expression";

type Comparator = (a: number, b: number) => boolean;

const comparators: Record<MetricComparator, Comparator> = {
  ":": (a, b) => a === b,
  ":<": (a, b) => a < b,
  ":>": (a, b) => a > b
};

export interface MetricComparison {
  metric: SearchableMetric;
  operator: MetricComparator;
  value: number;
}

export class MetricSearchTerm extends AbstractSearchTerm {
  public readonly comparison: MetricComparison;
  public readonly isRelative: boolean;
  protected override readonly baseCost: number = 0;
  private compare: Comparator;
  private rightValue: (item: MetricSearchable) => number;
  private leftValue: (item: MetricSearchable) => number;

  constructor(value: string, isNegated: boolean, expression: MetricSearchExpression) {
    super(value, isNegated);
    this.compare = comparators[expression.operator];
    this.leftValue = (item): number => item.getMetric(expression.metric);
    this.rightValue = expression.hasRightHandMetric ? (item): number => item.getMetric(expression.rightHandMetric) : (): number => expression.rightHandValue;
    this.isRelative = expression.hasRightHandMetric;
    this.comparison = { metric: expression.metric, operator: expression.operator, value: expression.rightHandValue };
  }

  public satisfiedBy(item: MetricSearchable): boolean {
    return this.compare(this.leftValue(item), this.rightValue(item));
  }

  protected override matchesPositive(item: MetricSearchable): boolean {
    return this.satisfiedBy(item);
  }

  protected override matchesNegated(item: MetricSearchable): boolean {
    return !this.satisfiedBy(item);
  }
}
