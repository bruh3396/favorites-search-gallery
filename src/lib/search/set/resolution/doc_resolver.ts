import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { InvertedIndex } from "@/lib/search/set/indexes/inverted_index";
import { MetricComparison } from "@/lib/search/parsers/metric_comparison";
import { MetricIndex } from "@/lib/search/set/indexes/metric_index";
import { MetricSearchTerm } from "@/lib/search/terms/metric_search_term";
import { PositionIndex } from "@/lib/search/set/indexes/position_index";
import { RelativeMetricIndex } from "@/lib/search/set/indexes/relative_metric_index";
import { WildcardDocResolver } from "@/lib/search/set/resolution/wildcard_doc_resolver";
import { WildcardSearchTerm } from "@/lib/search/terms/wildcard_search_term";

export class DocResolver<Doc> {
  constructor(
    private readonly termIndex: InvertedIndex<Doc>,
    private readonly metricIndex: MetricIndex<Doc>,
    private readonly relativeMetricIndex: RelativeMetricIndex<Doc>,
    private readonly positionIndex: PositionIndex<Doc>,
    private readonly wildcardResolver: WildcardDocResolver<Doc>
  ) { }

  public docsFor(term: AbstractSearchTerm): ReadonlySet<Doc> {
    if (term instanceof MetricSearchTerm) {
      return this.docsForMetric(term.comparison);
    }

    if (term instanceof WildcardSearchTerm) {
      return this.wildcardResolver.resolve(term);
    }
    return this.termIndex.docsForTerm(term.value) ?? new Set<Doc>();
  }

  public sortByPosition(docs: Doc[]): Doc[] {
    return this.positionIndex.sort(docs);
  }

  private docsForMetric(comparison: MetricComparison): ReadonlySet<Doc> {
    return comparison.isRelative ? this.docsForRelativeMetric(comparison) : this.docsForAbsoluteMetric(comparison);
  }

  private docsForRelativeMetric(comparison: MetricComparison): ReadonlySet<Doc> {
    if (comparison.isTautological) {
      return comparison.operator === ":" ? this.termIndex.allDocs() : new Set<Doc>();
    }
    this.relativeMetricIndex.ensureBuilt(this.termIndex.allDocs());
    return this.relativeMetricIndex.docsFor(comparison);
  }

  private docsForAbsoluteMetric(comparison: MetricComparison): ReadonlySet<Doc> {
    this.metricIndex.ensureBuilt(this.termIndex.allDocs());
    return this.metricIndex.docsMatching(comparison);
  }
}
