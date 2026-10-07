import { SearchEngine, TermUpdate } from "@/core/search/engines/search_engine";
import { BitEvaluator } from "@/core/search/engines/bit/logic/bit_evaluator";
import { BitIndex } from "@/core/search/engines/bit/indexes/bit_index";
import { Metric } from "@/core/domain/post/post";
import { MetricBitIndex } from "@/core/search/engines/bit/indexes/metric_index";
import { PostingResolver } from "@/core/search/engines/bit/resolution/posting_resolver";
import { SearchExpression } from "@/core/search/expressions/search_expression";
import { WildcardPostingResolver } from "@/core/search/engines/bit/resolution/wildcard_posting_resolver";

export class BitSearchEngine<Doc> implements SearchEngine<Doc> {
  private readonly bitIndex: BitIndex<Doc>;
  private readonly metricIndex: MetricBitIndex<Doc>;
  private readonly wildcardResolver: WildcardPostingResolver<Doc>;
  private readonly bitEvaluator: BitEvaluator<Doc>;

  constructor(getTerms: (doc: Doc) => Iterable<string>, getMetric: (doc: Doc, metric: Metric) => number, docs: Doc[] = []) {
    this.bitIndex = new BitIndex<Doc>(getTerms);
    this.metricIndex = new MetricBitIndex<Doc>(getMetric);
    this.wildcardResolver = new WildcardPostingResolver(this.bitIndex);
    this.bitEvaluator = new BitEvaluator(this.bitIndex, new PostingResolver(this.bitIndex, this.metricIndex, this.wildcardResolver));
    this.rebuild(docs);
  }

  public search(expression: SearchExpression, candidates?: Doc[]): Doc[] {
    const matches = this.bitEvaluator.evaluate(expression);

    if (candidates === undefined || candidates.length === this.bitIndex.size) {
      return matches;
    }
    const candidateSet = new Set(candidates);
    return matches.filter(doc => candidateSet.has(doc));
  }

  public rebuild(docs: Doc[]): void {
    this.bitIndex.build(docs);
    this.metricIndex.build(this.bitIndex.width, this.bitIndex.allDocs());
    this.wildcardResolver.index(this.bitIndex.indexedTerms());
  }

  public add(docs: Doc[]): void {
    this.bitIndex.add(docs).forEach(term => this.wildcardResolver.add(term));
    this.metricIndex.build(this.bitIndex.width, this.bitIndex.allDocs());
  }

  public update(updates: readonly TermUpdate<Doc>[]): void {
    const { added, removed } = this.bitIndex.update(updates);

    added.forEach(term => this.wildcardResolver.add(term));
    removed.forEach(term => this.wildcardResolver.remove(term));
    this.metricIndex.build(this.bitIndex.width, this.bitIndex.allDocs());
  }
}
