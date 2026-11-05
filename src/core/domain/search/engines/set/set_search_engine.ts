import { SearchEngine, SearchEngineDependencies } from "@/core/domain/search/engines/search_engine";
import { DocResolver } from "@/core/domain/search/engines/set/resolution/doc_resolver";
import { InvertedIndex } from "@/core/domain/search/engines/set/indexes/inverted_index";
import { METRICS } from "@/core/domain/search/metric";
import { MetricIndex } from "@/core/domain/search/engines/set/indexes/metric_index";
import { PositionIndex } from "@/core/domain/search/engines/set/indexes/position_index";
import { RelativeMetricIndex } from "@/core/domain/search/engines/set/indexes/relative_metric_index";
import { SearchExpression } from "@/core/domain/search/expressions/search_expression";
import { SetEvaluator } from "@/core/domain/search/engines/set/logic/set_evaluator";
import { TermUpdate } from "@/core/domain/search/engines/term_update";
import { WildcardDocResolver } from "@/core/domain/search/engines/set/resolution/wildcard_doc_resolver";

export class SetSearchEngine<Doc> implements SearchEngine<Doc> {
  private readonly invertedIndex: InvertedIndex<Doc>;
  private readonly metricIndex: MetricIndex<Doc>;
  private readonly relativeMetricIndex: RelativeMetricIndex<Doc>;
  private readonly positionIndex: PositionIndex<Doc>;
  private readonly wildcardDocResolver: WildcardDocResolver<Doc>;
  private readonly evaluator: SetEvaluator<Doc>;

  constructor({ getTerms, getMetric, stringInterner }: SearchEngineDependencies<Doc>, docs: readonly Doc[] = []) {
    this.invertedIndex = new InvertedIndex<Doc>(getTerms);
    this.metricIndex = new MetricIndex<Doc>([...METRICS], getMetric);
    this.relativeMetricIndex = new RelativeMetricIndex<Doc>([...METRICS], getMetric);
    this.positionIndex = new PositionIndex<Doc>();
    this.wildcardDocResolver = new WildcardDocResolver<Doc>({ invertedIndex: this.invertedIndex, stringInterner });
    this.evaluator = new SetEvaluator<Doc>(
      this.invertedIndex,
      new DocResolver<Doc>({
        invertedIndex: this.invertedIndex,
        metricIndex: this.metricIndex,
        relativeMetricIndex: this.relativeMetricIndex,
        positionIndex: this.positionIndex,
        wildcardDocResolver: this.wildcardDocResolver
      })
    );
    this.rebuild(docs);
  }

  public search(searchExpression: SearchExpression, candidateDocs?: readonly Doc[]): readonly Doc[] {
    return this.evaluator.evaluate(searchExpression, candidateDocs);
  }

  public countDocsWithTerm(term: string): number {
    return this.invertedIndex.docsForTerm(term)?.size ?? 0;
  }

  public getTermsStartingWith(prefix: string): string[] {
    return this.wildcardDocResolver.getTermsStartingWith(prefix);
  }

  public rebuild(docs: readonly Doc[]): void {
    this.invertedIndex.addDocs(docs);
    this.wildcardDocResolver.index(this.invertedIndex.indexedTerms());
    this.positionIndex.build(docs);
    this.metricIndex.invalidate();
    this.relativeMetricIndex.invalidate();
  }

  public add(docs: readonly Doc[]): void {
    for (const doc of docs) {
      this.invertedIndex.addDoc(doc).forEach(term => this.wildcardDocResolver.add(term));
      this.positionIndex.add(doc);
      this.metricIndex.add(doc);
      this.relativeMetricIndex.add(doc);
    }
  }

  public update(termUpdates: readonly TermUpdate<Doc>[]): void {
    const { added, removed } = this.invertedIndex.updateDocs(termUpdates);

    added.forEach(term => this.wildcardDocResolver.add(term));
    removed.forEach(term => this.wildcardDocResolver.remove(term));
  }
}
