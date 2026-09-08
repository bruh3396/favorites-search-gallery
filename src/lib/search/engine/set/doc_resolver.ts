import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { InvertedIndex } from "@/lib/search/index/inverted_index";
import { MetricIndex } from "@/lib/search/index/metric_index";
import { MetricSearchComparison } from "@/lib/search/parsers/metric_search_comparison";
import { MetricSearchTerm } from "@/lib/search/terms/metric_search_term";
import { PositionIndex } from "@/lib/search/index/position_index";
import { RelativeMetricIndex } from "@/lib/search/index/relative_metric_index";
import { Searchable } from "@/types/search";

export class DocResolver<Doc extends Searchable> {
  constructor(
    private readonly termIndex: InvertedIndex<Doc>,
    private readonly metricIndex: MetricIndex<Doc>,
    private readonly relativeMetricIndex: RelativeMetricIndex<Doc>,
    private readonly positionIndex: PositionIndex<Doc>
  ) { }

  public docsFor(term: AbstractSearchTerm): ReadonlySet<Doc> {
    if (term instanceof MetricSearchTerm) {
      return this.docsForMetric(term.comparison);
    }
    return this.termIndex.docsForTerm(term.value) ?? new Set<Doc>();
  }

  public allDocs(): ReadonlySet<Doc> {
    return this.termIndex.allDocs();
  }

  public sortByPosition(docs: Doc[]): Doc[] {
    return this.positionIndex.sort(docs);
  }

  private docsForMetric(comparison: MetricSearchComparison): ReadonlySet<Doc> {
    return comparison.isRelative ? this.docsForRelativeMetric(comparison) : this.docsForAbsoluteMetric(comparison);
  }

  private docsForRelativeMetric(comparison: MetricSearchComparison): ReadonlySet<Doc> {
    if (comparison.isTautological) {
      return comparison.operator === ":" ? this.allDocs() : new Set<Doc>();
    }
    this.relativeMetricIndex.ensureBuilt(this.allDocs());
    return this.relativeMetricIndex.docsFor(comparison);
  }

  private docsForAbsoluteMetric(comparison: MetricSearchComparison): ReadonlySet<Doc> {
    this.metricIndex.ensureBuilt(this.allDocs());
    return this.metricIndex.docsMatching(comparison);
  }
}
