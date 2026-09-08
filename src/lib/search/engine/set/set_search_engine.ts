import { Searchable, SearchableMetric } from "@/types/search";
import { DocResolver } from "@/lib/search/engine/set/doc_resolver";
import { SearchEngine } from "@/lib/search/engine/search_engine";
import { InvertedIndex } from "@/lib/search/index/inverted_index";
import { MetricIndex } from "@/lib/search/index/metric_index";
import { PositionIndex } from "@/lib/search/index/position_index";
import { RelativeMetricIndex } from "@/lib/search/index/relative_metric_index";
import { SetSearcher } from "@/lib/search/engine/set/set_searcher";
import { WildcardTermExpander } from "@/lib/search/engine/set/wildcard_term_expander";
import { WildcardTermResolver } from "@/lib/search/engine/set/wildcard_term_resolver";
import { isEmptyString } from "@/utils/pure/string";
import { parseSearchQuery } from "@/lib/search/parsers/search_term_group_parser";
import { searchableMetrics } from "@/types/guards";

export class SetSearchEngine<Doc extends Searchable> implements SearchEngine<Doc> {
  private readonly termIndex: InvertedIndex<Doc>;
  private readonly metricIndex: MetricIndex<Doc>;
  private readonly relativeMetricIndex: RelativeMetricIndex<Doc>;
  private readonly positionIndex: PositionIndex<Doc>;
  private readonly wildcardResolver = new WildcardTermResolver();
  private readonly wildcardExpander = new WildcardTermExpander<Doc>(this.wildcardResolver);
  private readonly setSearcher: SetSearcher<Doc>;

  constructor(termsFor: (doc: Doc) => Iterable<string>, metricFor: (doc: Doc, metric: SearchableMetric) => number, docs: Doc[] = []) {
    this.termIndex = new InvertedIndex<Doc>(termsFor);
    this.metricIndex = new MetricIndex<Doc>([...searchableMetrics], metricFor);
    this.relativeMetricIndex = new RelativeMetricIndex<Doc>([...searchableMetrics], metricFor);
    this.positionIndex = new PositionIndex<Doc>();
    this.setSearcher = new SetSearcher<Doc>(new DocResolver<Doc>(this.termIndex, this.metricIndex, this.relativeMetricIndex, this.positionIndex));
    this.index(docs);
  }

  public search(query: string, candidates: Doc[]): Doc[] {
    if (isEmptyString(query)) {
      return candidates;
    }
    const { searchQuery, isUnmatchable } = this.wildcardExpander.expand(parseSearchQuery<Doc>(query));
    return isUnmatchable ? [] : this.setSearcher.search(searchQuery, candidates);
  }

  public index(docs: Doc[]): void {
    this.termIndex.addDocs(docs);
    this.wildcardResolver.index(this.termIndex.indexedTerms());
    this.positionIndex.build(docs);
    this.wildcardExpander.clearCache();
  }

  public add(doc: Doc): void {
    this.termIndex.addDoc(doc).forEach(term => this.wildcardResolver.addTerm(term));
    this.metricIndex.add(doc);
    this.relativeMetricIndex.add(doc);
    this.positionIndex.add(doc);
    this.wildcardExpander.clearCache();
  }

  public remove(doc: Doc): void {
    this.termIndex.removeDoc(doc).forEach(term => this.wildcardResolver.removeTerm(term));
    this.metricIndex.remove(doc);
    this.relativeMetricIndex.remove(doc);
    this.wildcardExpander.clearCache();
  }
}
