import { SearchEngine, SearchEngineDependencies } from "@/core/domain/search/engines/search_engine";
import { BitEvaluator } from "@/core/domain/search/engines/bit/logic/bit_evaluator";
import { BitIndex } from "@/core/domain/search/engines/bit/indexes/bit_index";
import { MetricBitIndex } from "@/core/domain/search/engines/bit/indexes/metric_bit_index";
import { PostingResolver } from "@/core/domain/search/engines/bit/resolution/posting_resolver";
import { SearchExpression } from "@/core/domain/search/expressions/search_expression";
import { TermUpdate } from "@/core/domain/search/engines/term_update";
import { WildcardPostingResolver } from "@/core/domain/search/engines/bit/resolution/wildcard_posting_resolver";

export class BitSearchEngine<Doc> implements SearchEngine<Doc> {
  private readonly index: BitIndex<Doc>;
  private readonly evaluator: BitEvaluator<Doc>;
  private readonly metricBitIndex: MetricBitIndex<Doc>;
  private readonly wildcardPostingResolver: WildcardPostingResolver<Doc>;

  constructor({ getTerms, getMetric, stringInterner }: SearchEngineDependencies<Doc>, docs: readonly Doc[] = []) {
    this.index = new BitIndex<Doc>({ getTerms, stringInterner });
    this.metricBitIndex = new MetricBitIndex<Doc>(getMetric);
    this.wildcardPostingResolver = new WildcardPostingResolver({ bitIndex: this.index, stringInterner });
    this.evaluator = new BitEvaluator(this.index, new PostingResolver(this.index, this.metricBitIndex, this.wildcardPostingResolver));
    this.rebuild(docs);
  }

  public search(searchExpression: SearchExpression, candidateDocs?: readonly Doc[]): readonly Doc[] {
    const matchedDocs = this.evaluator.evaluate(searchExpression);

    if (candidateDocs === undefined || candidateDocs.length === this.index.size) {
      return matchedDocs;
    }
    const candidateSet = new Set(candidateDocs);
    return matchedDocs.filter(doc => candidateSet.has(doc));
  }

  public countDocsWithTerm(term: string): number {
    return this.index.findPosting(term)?.cardinality ?? 0;
  }

  public getTermsStartingWith(prefix: string): string[] {
    return this.wildcardPostingResolver.getTermsStartingWith(prefix);
  }

  public rebuild(docs: readonly Doc[]): void {
    this.index.build(docs);
    this.metricBitIndex.build(this.index.width, this.index.allDocs());
    this.wildcardPostingResolver.index(this.index.indexedTerms());
  }

  public add(docs: readonly Doc[]): void {
    this.index.add(docs).forEach(term => this.wildcardPostingResolver.add(term));
    this.metricBitIndex.build(this.index.width, this.index.allDocs());
  }

  public update(termUpdates: readonly TermUpdate<Doc>[]): void {
    const { added, removed } = this.index.update(termUpdates);

    added.forEach(term => this.wildcardPostingResolver.add(term));
    removed.forEach(term => this.wildcardPostingResolver.remove(term));
    this.metricBitIndex.build(this.index.width, this.index.allDocs());
  }
}
