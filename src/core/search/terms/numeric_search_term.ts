import { AbstractSearchTerm, ParsedTerm } from "@/core/search/terms/abstract_search_term";
import { MetricComparison } from "@/core/search/parsers/metric_comparison";
import { MetricSearchable } from "@/core/search/searchable";

export class NumericSearchTerm extends AbstractSearchTerm {
  public readonly idComparison: MetricComparison;
  protected override readonly baseCost: number = 0;

  constructor(parsed: ParsedTerm, idComparison: MetricComparison) {
    super(parsed);
    this.idComparison = idComparison;
  }

  protected override matchesPositive(item: MetricSearchable): boolean {
    return item.tags.has(this.value) || item.getMetric("id") === this.idComparison.value;
  }

  protected override matchesNegated(item: MetricSearchable): boolean {
    return !item.tags.has(this.value) && item.getMetric("id") !== this.idComparison.value;
  }
}
