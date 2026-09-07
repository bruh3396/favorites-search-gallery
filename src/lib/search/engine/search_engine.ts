import { Searchable, SearchableMetric } from "@/types/search";
import { DocsResolver } from "@/lib/search/engine/docs_resolver";
import { InvertedIndex } from "@/lib/collection/inverted_index";
import { InvertedIndexedSearcher } from "@/lib/search/engine/inverted_index_searcher";
import { MetricIndex } from "@/lib/collection/metric_index";
import { WildcardTermResolver } from "@/lib/search/engine/wildcard_term_resolver";
import { expandWildcardTerms } from "@/lib/search/engine/wildcard_term_expander";
import { isEmptyString } from "@/utils/pure/string";
import { parseSearchQuery } from "@/lib/search/parsers/search_term_group_parser";
import { searchableMetrics } from "@/types/guards";

export class SearchEngine<T extends Searchable> {
  private readonly termIndex: InvertedIndex<T>;
  private readonly metricIndex: MetricIndex<T>;
  private readonly searcher: InvertedIndexedSearcher<T>;
  private readonly wildcardResolver = new WildcardTermResolver();

  constructor(termsFor: (doc: T) => Iterable<string>, metricFor: (doc: T, metric: SearchableMetric) => number, docs: T[] = []) {
    this.termIndex = new InvertedIndex<T>(termsFor);
    this.metricIndex = new MetricIndex<T>([...searchableMetrics], metricFor);
    this.searcher = new InvertedIndexedSearcher<T>(new DocsResolver<T>(this.termIndex, this.metricIndex, metricFor));
    this.index(docs);
  }

  public search(query: string, candidates: T[]): T[] {
    if (isEmptyString(query)) {
      return candidates;
    }
    const { searchQuery, isUnmatchable } = expandWildcardTerms(parseSearchQuery<T>(query), this.wildcardResolver);
    return isUnmatchable ? [] : this.searcher.search(searchQuery, candidates);
  }

  public index(docs: T[]): void {
    this.termIndex.addDocs(docs);
    this.wildcardResolver.index(this.termIndex.indexedTerms());
    this.metricIndex.build(this.termIndex.allDocs());
  }

  public add(doc: T): void {
    this.termIndex.addDoc(doc).forEach(term => this.wildcardResolver.addTerm(term));
    this.metricIndex.add(doc);
  }

  public remove(doc: T): void {
    this.termIndex.removeDoc(doc).forEach(term => this.wildcardResolver.removeTerm(term));
    this.metricIndex.remove(doc);
  }
}
