import { MetricSearchable, Searchable, SearchableMetric } from "@/types/search";
import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { InvertedIndex } from "@/lib/collection/inverted_index";
import { MetricIndex } from "@/lib/collection/metric_index";
import { MetricSearchTerm } from "@/lib/search/terms/metric_search_term";
import { SearchQuery } from "@/lib/search/engine/search_query";

export class DocsResolver<T extends Searchable> {
  private relativeDocs: Map<MetricSearchTerm, Set<T>> = new Map<MetricSearchTerm, Set<T>>();

  constructor(
    private readonly termIndex: InvertedIndex<T>,
    private readonly metricIndex: MetricIndex<T>,
    private readonly metricFor: (doc: T, metric: SearchableMetric) => number
  ) { }

  public prime(searchQuery: SearchQuery<T>): void {
    const relativeTerms = searchQuery.allTerms().filter((term): term is MetricSearchTerm => term instanceof MetricSearchTerm && term.isRelative);

    this.relativeDocs = new Map();

    if (relativeTerms.length === 0) {
      return;
    }

    for (const term of relativeTerms) {
      this.relativeDocs.set(term, new Set<T>());
    }

    for (const doc of this.termIndex.allDocs()) {
      const metricView = this.asMetricSearchable(doc);

      for (const term of relativeTerms) {
        if (term.satisfiedBy(metricView)) {
          this.relativeDocs.get(term)?.add(doc);
        }
      }
    }
  }

  public docsFor(term: AbstractSearchTerm): ReadonlySet<T> {
    if (term instanceof MetricSearchTerm) {
      return term.isRelative ? this.relativeDocs.get(term) ?? new Set<T>() : new Set(this.metricIndex.docsMatching(term.comparison));
    }
    return this.termIndex.docsForTerm(term.value) ?? new Set<T>();
  }

  public allDocs(): ReadonlySet<T> {
    return this.termIndex.allDocs();
  }

  private asMetricSearchable(doc: T): MetricSearchable {
    return {
      tags: doc.tags,
      getMetric: (metric: SearchableMetric): number => this.metricFor(doc, metric)
    };
  }
}
