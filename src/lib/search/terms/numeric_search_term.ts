import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { MetricComparison } from "@/lib/search/parsers/metric_comparison";
import { MetricSearchable } from "@/types/search";

export class NumericSearchTerm extends AbstractSearchTerm {
  public readonly idComparison: MetricComparison;
  protected override readonly baseCost: number = 0;

  constructor(value: string, isNegated: boolean, idComparison: MetricComparison) {
    super(value, isNegated);
    this.idComparison = idComparison;
  }

  protected override matchesPositive(item: MetricSearchable): boolean {
    return item.tags.has(this.value) || item.getMetric("id") === this.idComparison.value;
  }

  protected override matchesNegated(item: MetricSearchable): boolean {
    return !item.tags.has(this.value) && item.getMetric("id") !== this.idComparison.value;
  }
}
