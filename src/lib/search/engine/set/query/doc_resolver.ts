import { AbstractSearchTerm } from "@/lib/search/query/terms/abstract_search_term";
import { InvertedIndex } from "@/lib/search/engine/set/indexes/inverted";
import { MetricIndex } from "@/lib/search/engine/set/indexes/metric";
import { MetricSearchComparison } from "@/lib/search/query/parsers/metric_search_comparison";
import { MetricSearchTerm } from "@/lib/search/query/terms/metric_search_term";
import { PositionIndex } from "@/lib/search/engine/set/indexes/position";
import { RelativeMetricIndex } from "@/lib/search/engine/set/indexes/relative_metric";
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
