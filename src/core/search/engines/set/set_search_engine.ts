import { METRICS, Metric } from "@/core/domain/post/post";
import { SearchEngine, TermUpdate } from "@/core/search/engines/search_engine";
import { DocResolver } from "@/core/search/engines/set/resolution/doc_resolver";
import { InvertedIndex } from "@/core/search/engines/set/indexes/inverted_index";
import { MetricIndex } from "@/core/search/engines/set/indexes/metric_index";
import { PositionIndex } from "@/core/search/engines/set/indexes/position_index";
import { RelativeMetricIndex } from "@/core/search/engines/set/indexes/relative_metric_index";
import { SearchExpression } from "@/core/search/expressions/search_expression";
import { SetEvaluator } from "@/core/search/engines/set/logic/set_evaluator";
import { WildcardDocResolver } from "@/core/search/engines/set/resolution/wildcard_doc_resolver";

export class SetSearchEngine<Doc> implements SearchEngine<Doc> {
  private readonly termIndex: InvertedIndex<Doc>;
  private readonly metricIndex: MetricIndex<Doc>;
  private readonly relativeMetricIndex: RelativeMetricIndex<Doc>;
  private readonly positionIndex: PositionIndex<Doc>;
  private readonly wildcardResolver: WildcardDocResolver<Doc>;
  private readonly setEvaluator: SetEvaluator<Doc>;

  constructor(getTerms: (doc: Doc) => Iterable<string>, getMetric: (doc: Doc, metric: Metric) => number, docs: Doc[] = []) {
    this.termIndex = new InvertedIndex<Doc>(getTerms);
    this.metricIndex = new MetricIndex<Doc>([...METRICS], getMetric);
    this.relativeMetricIndex = new RelativeMetricIndex<Doc>([...METRICS], getMetric);
    this.positionIndex = new PositionIndex<Doc>();
    this.wildcardResolver = new WildcardDocResolver<Doc>(this.termIndex);
    this.setEvaluator = new SetEvaluator<Doc>(
      this.termIndex,
      new DocResolver<Doc>({
        termIndex: this.termIndex,
        metricIndex: this.metricIndex,
        relativeMetricIndex: this.relativeMetricIndex,
        positionIndex: this.positionIndex,
        wildcardResolver: this.wildcardResolver
      })
    );
    this.rebuild(docs);
  }

  public search(expression: SearchExpression, candidates?: Doc[]): Doc[] {
    return this.setEvaluator.evaluate(expression, candidates);
  }

  public rebuild(docs: Doc[]): void {
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
