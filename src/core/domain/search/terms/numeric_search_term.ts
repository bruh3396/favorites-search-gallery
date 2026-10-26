import { SearchTerm } from "@/core/domain/search/terms/search_term";
import { ParsedTerm } from "@/core/domain/search/terms/parsed_term";
import { MetricComparison } from "@/core/domain/search/parsers/metric_comparison";
import { MetricSearchable } from "@/core/domain/search/searchable";

export class NumericSearchTerm extends SearchTerm {
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
