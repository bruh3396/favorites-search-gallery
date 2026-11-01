import { MetricComparison } from "@/core/domain/search/parsers/metric_comparison";
import { MetricSearchable } from "@/core/domain/search/searchable";
import { ParsedTerm } from "@/core/domain/search/terms/parsed_term";
import { SearchTerm } from "@/core/domain/search/terms/search_term";

export class NumericSearchTerm extends SearchTerm {
  public readonly idMetricComparison: MetricComparison;
  protected override readonly baseCost: number = 0;

  constructor(parsedTerm: ParsedTerm, idMetricComparison: MetricComparison) {
    super(parsedTerm);
    this.idMetricComparison = idMetricComparison;
  }

  protected override matchesPositive(metricSearchable: MetricSearchable): boolean {
    return metricSearchable.tags.has(this.value) || metricSearchable.getMetric("id") === this.idMetricComparison.value;
  }

  protected override matchesNegated(metricSearchable: MetricSearchable): boolean {
    return !metricSearchable.tags.has(this.value) && metricSearchable.getMetric("id") !== this.idMetricComparison.value;
  }
}
