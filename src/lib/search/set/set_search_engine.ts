import { SearchEngine, TermUpdate } from "@/lib/search/search_engine";
import { SearchableMetric } from "@/types/search";
import { DocResolver } from "@/lib/search/set/resolution/doc_resolver";
import { InvertedIndex } from "@/lib/search/set/indexes/inverted_index";
import { MetricIndex } from "@/lib/search/set/indexes/metric_index";
import { PositionIndex } from "@/lib/search/set/indexes/position_index";
import { RelativeMetricIndex } from "@/lib/search/set/indexes/relative_metric_index";
import { SetSearcher } from "@/lib/search/set/logic/set_searcher";
import { WildcardDocResolver } from "@/lib/search/set/resolution/wildcard_doc_resolver";
import { parseSearchQuery } from "@/lib/search/parsers/search_term_group_parser";
import { searchableMetrics } from "@/types/guards";

export class SetSearchEngine<Doc> implements SearchEngine<Doc> {
  private readonly termIndex: InvertedIndex<Doc>;
  private readonly metricIndex: MetricIndex<Doc>;
  private readonly relativeMetricIndex: RelativeMetricIndex<Doc>;
  private readonly positionIndex: PositionIndex<Doc>;
  private readonly wildcardResolver: WildcardDocResolver<Doc>;
  private readonly setSearcher: SetSearcher<Doc>;

  constructor(termsFor: (doc: Doc) => Iterable<string>, metricFor: (doc: Doc, metric: SearchableMetric) => number, docs: Doc[] = []) {
    this.termIndex = new InvertedIndex<Doc>(termsFor);
    this.metricIndex = new MetricIndex<Doc>([...searchableMetrics], metricFor);
    this.relativeMetricIndex = new RelativeMetricIndex<Doc>([...searchableMetrics], metricFor);
    this.positionIndex = new PositionIndex<Doc>();
    this.wildcardResolver = new WildcardDocResolver<Doc>(this.termIndex);
    this.setSearcher = new SetSearcher<Doc>(this.termIndex, new DocResolver<Doc>(this.termIndex, this.metricIndex, this.relativeMetricIndex, this.positionIndex, this.wildcardResolver));
    this.index(docs);
  }

  public search(query: string, candidates: Doc[]): Doc[] {
    return this.setSearcher.search(parseSearchQuery<Doc>(query), candidates);
  }

  public invert(current: Doc[], retain?: string): Doc[] {
    const complement = this.positionIndex.complementOf(current);
    return retain === undefined ? complement : this.search(retain, complement);
  }

  public index(docs: Doc[]): void {
    this.termIndex.addDocs(docs);
    this.wildcardResolver.index(this.termIndex.indexedTerms());
    this.positionIndex.build(docs);
  }

  public add(docs: Doc[]): void {
    for (const doc of docs) {
      this.termIndex.addDoc(doc).forEach(term => this.wildcardResolver.add(term));
      this.positionIndex.add(doc);
    }
  }

  public update(updates: readonly TermUpdate<Doc>[]): void {
    const { added, removed } = this.termIndex.updateDocs(updates);

    added.forEach(term => this.wildcardResolver.add(term));
    removed.forEach(term => this.wildcardResolver.remove(term));
  }
}
