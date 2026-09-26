import { SearchEngine, TermUpdate } from "@/lib/search/engines/search_engine";
import { DocResolver } from "@/lib/search/engines/set/resolution/doc_resolver";
import { InvertedIndex } from "@/lib/search/engines/set/indexes/inverted_index";
import { MetricIndex } from "@/lib/search/engines/set/indexes/metric_index";
import { PositionIndex } from "@/lib/search/engines/set/indexes/position_index";
import { RelativeMetricIndex } from "@/lib/search/engines/set/indexes/relative_metric_index";
import { SearchableMetric } from "@/types/search";
import { SetEvaluator } from "@/lib/search/engines/set/logic/set_evaluator";
import { WildcardDocResolver } from "@/lib/search/engines/set/resolution/wildcard_doc_resolver";
import { searchableMetrics } from "@/types/guards";
import { tryParseSearchExpression } from "@/lib/search/parsers/search_expression_parser";

export class SetSearchEngine<Doc> implements SearchEngine<Doc> {
  private readonly termIndex: InvertedIndex<Doc>;
  private readonly metricIndex: MetricIndex<Doc>;
  private readonly relativeMetricIndex: RelativeMetricIndex<Doc>;
  private readonly positionIndex: PositionIndex<Doc>;
  private readonly wildcardResolver: WildcardDocResolver<Doc>;
  private readonly setEvaluator: SetEvaluator<Doc>;

  constructor(termsFor: (doc: Doc) => Iterable<string>, metricFor: (doc: Doc, metric: SearchableMetric) => number, docs: Doc[] = []) {
    this.termIndex = new InvertedIndex<Doc>(termsFor);
    this.metricIndex = new MetricIndex<Doc>([...searchableMetrics], metricFor);
    this.relativeMetricIndex = new RelativeMetricIndex<Doc>([...searchableMetrics], metricFor);
    this.positionIndex = new PositionIndex<Doc>();
    this.wildcardResolver = new WildcardDocResolver<Doc>(this.termIndex);
    this.setEvaluator = new SetEvaluator<Doc>(this.termIndex, new DocResolver<Doc>(this.termIndex, this.metricIndex, this.relativeMetricIndex, this.positionIndex, this.wildcardResolver));
    this.index(docs);
  }

  public search(query: string, candidates: Doc[]): Doc[] {
    const expression = tryParseSearchExpression(query);
    return expression === undefined ? [] : this.setEvaluator.evaluate(expression, candidates);
  }

  public complementOf(current: Doc[], filter?: string): Doc[] {
    const complement = this.positionIndex.complementOf(current);
    return filter === undefined ? complement : this.search(filter, complement);
  }

  public index(docs: Doc[]): void {
    this.termIndex.addDocs(docs);
    this.wildcardResolver.index(this.termIndex.indexedTerms());
    this.positionIndex.build(docs);
    this.metricIndex.invalidate();
    this.relativeMetricIndex.invalidate();
  }

  public add(docs: Doc[]): void {
    for (const doc of docs) {
      this.termIndex.addDoc(doc).forEach(term => this.wildcardResolver.add(term));
      this.positionIndex.add(doc);
      this.metricIndex.add(doc);
      this.relativeMetricIndex.add(doc);
    }
  }

  public update(updates: readonly TermUpdate<Doc>[]): void {
    const { added, removed } = this.termIndex.updateDocs(updates);

    added.forEach(term => this.wildcardResolver.add(term));
    removed.forEach(term => this.wildcardResolver.remove(term));
  }
}
