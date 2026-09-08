import { Searchable, SearchableMetric } from "@/types/search";
import { DocResolver } from "@/lib/search/engine/set/query/doc_resolver";
import { InvertedIndex } from "@/lib/search/engine/set/indexes/inverted";
import { MetricIndex } from "@/lib/search/engine/set/indexes/metric";
import { PositionIndex } from "@/lib/search/engine/set/indexes/position";
import { RelativeMetricIndex } from "@/lib/search/engine/set/indexes/relative_metric";
import { SearchEngine } from "@/lib/search/engine/search_engine";
import { SetSearcher } from "@/lib/search/engine/set/query/searcher";
import { WildcardMatcher } from "@/lib/search/indexes/wildcard_matcher";
import { WildcardTermExpander } from "@/lib/search/engine/set/wildcard/term_expander";
import { parseSearchQuery } from "@/lib/search/query/parsers/search_term_group_parser";
import { searchableMetrics } from "@/types/guards";

export class SetSearchEngine<Doc extends Searchable> implements SearchEngine<Doc> {
  private readonly termIndex: InvertedIndex<Doc>;
  private readonly metricIndex: MetricIndex<Doc>;
  private readonly relativeMetricIndex: RelativeMetricIndex<Doc>;
  private readonly positionIndex: PositionIndex<Doc>;
  private readonly wildcardMatcher = new WildcardMatcher();
  private readonly wildcardExpander = new WildcardTermExpander<Doc>(this.wildcardMatcher);
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
    const { searchQuery, isUnmatchable } = this.wildcardExpander.expand(parseSearchQuery<Doc>(query));
    return isUnmatchable ? [] : this.setSearcher.search(searchQuery, candidates);
  }

  public index(docs: Doc[]): void {
    this.termIndex.addDocs(docs);
    this.wildcardMatcher.index(this.termIndex.indexedTerms());
    this.positionIndex.build(docs);
  }

  public add(doc: Doc): void {
    this.termIndex.addDoc(doc).forEach(term => this.wildcardMatcher.add(term));
    this.metricIndex.add(doc);
    this.relativeMetricIndex.add(doc);
    this.positionIndex.add(doc);
  }

  public remove(doc: Doc): void {
    this.termIndex.removeDoc(doc).forEach(term => this.wildcardMatcher.remove(term));
    this.metricIndex.remove(doc);
    this.relativeMetricIndex.remove(doc);
  }
}
