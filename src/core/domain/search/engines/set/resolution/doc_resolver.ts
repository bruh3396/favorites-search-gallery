import { SearchTerm } from "@/core/domain/search/terms/search_term";
import { InvertedIndex } from "@/core/domain/search/engines/set/indexes/inverted_index";
import { MetricComparison } from "@/core/domain/search/parsers/metric_comparison";
import { MetricIndex } from "@/core/domain/search/engines/set/indexes/metric_index";
import { MetricSearchTerm } from "@/core/domain/search/terms/metric_search_term";
import { NumericSearchTerm } from "@/core/domain/search/terms/numeric_search_term";
import { PositionIndex } from "@/core/domain/search/engines/set/indexes/position_index";
import { RelativeMetricIndex } from "@/core/domain/search/engines/set/indexes/relative_metric_index";
import { WildcardDocResolver } from "@/core/domain/search/engines/set/resolution/wildcard_doc_resolver";
import { WildcardSearchTerm } from "@/core/domain/search/terms/wildcard_search_term";
import { union } from "@/core/utils/collection/set_utilities";

export interface DocResolverDependencies<Doc> {
  invertedIndex: InvertedIndex<Doc>;
  metricIndex: MetricIndex<Doc>;
  relativeMetricIndex: RelativeMetricIndex<Doc>;
  positionIndex: PositionIndex<Doc>;
  wildcardDocResolver: WildcardDocResolver<Doc>;
}

export class DocResolver<Doc> {
  private readonly invertedIndex: InvertedIndex<Doc>;
  private readonly metricIndex: MetricIndex<Doc>;
  private readonly relativeMetricIndex: RelativeMetricIndex<Doc>;
  private readonly positionIndex: PositionIndex<Doc>;
  private readonly wildcardDocResolver: WildcardDocResolver<Doc>;

  constructor({ invertedIndex, metricIndex, relativeMetricIndex, positionIndex, wildcardDocResolver }: DocResolverDependencies<Doc>) {
    this.invertedIndex = invertedIndex;
    this.metricIndex = metricIndex;
    this.relativeMetricIndex = relativeMetricIndex;
    this.positionIndex = positionIndex;
    this.wildcardDocResolver = wildcardDocResolver;
  }

  public resolve(searchTerm: SearchTerm): ReadonlySet<Doc> {
    if (searchTerm instanceof NumericSearchTerm) {
      return this.docsForNumeric(searchTerm);
    }

    if (searchTerm instanceof MetricSearchTerm) {
      return this.docsForMetric(searchTerm.comparison);
    }

    if (searchTerm instanceof WildcardSearchTerm) {
      return this.wildcardDocResolver.resolve(searchTerm);
    }
    return this.invertedIndex.docsForTerm(searchTerm.value) ?? new Set<Doc>();
  }

  public sortByPosition(docs: readonly Doc[]): readonly Doc[] {
    return this.positionIndex.sort(docs);
  }

  private docsForNumeric(numericSearchTerm: NumericSearchTerm): ReadonlySet<Doc> {
    const taggedDocs = this.invertedIndex.docsForTerm(numericSearchTerm.value) ?? new Set<Doc>();
    return union(taggedDocs, this.docsForMetric(numericSearchTerm.idMetricComparison));
  }

  private docsForMetric(metricComparison: MetricComparison): ReadonlySet<Doc> {
    return metricComparison.isRelative ? this.docsForRelativeMetric(metricComparison) : this.docsForAbsoluteMetric(metricComparison);
  }

  private docsForRelativeMetric(metricComparison: MetricComparison): ReadonlySet<Doc> {
    if (metricComparison.isTautological) {
      return metricComparison.comparator === ":" ? this.invertedIndex.allDocs() : new Set<Doc>();
    }
    this.relativeMetricIndex.ensureBuilt(this.invertedIndex.allDocs());
    return this.relativeMetricIndex.getDocs(metricComparison);
  }

  private docsForAbsoluteMetric(metricComparison: MetricComparison): ReadonlySet<Doc> {
    this.metricIndex.ensureBuilt(this.invertedIndex.allDocs());
    return this.metricIndex.docsMatching(metricComparison);
  }
}
