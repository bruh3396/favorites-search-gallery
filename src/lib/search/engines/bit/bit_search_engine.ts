import { SearchEngine, TermUpdate } from "@/lib/search/engines/search_engine";
import { BitEvaluator } from "@/lib/search/engines/bit/logic/bit_evaluator";
import { BitIndex } from "@/lib/search/engines/bit/indexes/bit_index";
import { BitSet } from "@/lib/search/engines/bit/postings/bitset";
import { MetricBitIndex } from "@/lib/search/engines/bit/indexes/metric_index";
import { PostingResolver } from "@/lib/search/engines/bit/resolution/posting_resolver";
import { SearchableMetric } from "@/types/search";
import { WildcardPostingResolver } from "@/lib/search/engines/bit/resolution/wildcard_posting_resolver";
import { tryParseSearchExpression } from "@/lib/search/parsers/search_expression_parser";

export class BitSearchEngine<Doc> implements SearchEngine<Doc> {
  private readonly bitIndex: BitIndex<Doc>;
  private readonly metricIndex: MetricBitIndex<Doc>;
  private readonly wildcardResolver: WildcardPostingResolver<Doc>;
  private readonly evaluator: BitEvaluator<Doc>;

  constructor(termsFor: (doc: Doc) => Iterable<string>, metricFor: (doc: Doc, metric: SearchableMetric) => number = () => 0, docs: Doc[] = []) {
    this.bitIndex = new BitIndex<Doc>(termsFor);
    this.metricIndex = new MetricBitIndex<Doc>(metricFor);
    this.wildcardResolver = new WildcardPostingResolver(this.bitIndex);
    this.evaluator = new BitEvaluator(this.bitIndex, new PostingResolver(this.bitIndex, this.metricIndex, this.wildcardResolver));
    this.index(docs);
  }

  public search(query: string, candidates?: Doc[]): Doc[] {
    const expression = tryParseSearchExpression(query);

    if (expression === undefined) {
      return [];
    }
    const matches = this.evaluator.evaluate(expression);

    if (candidates === undefined || candidates.length === this.bitIndex.size) {
      return matches;
    }
    const candidateSet = new Set(candidates);
    return matches.filter(doc => candidateSet.has(doc));
  }

  public complementOf(current: Doc[], filter?: string): Doc[] {
    return this.bitIndex.complementOfDocs(current, this.bitSetFromQuery(filter));
  }

  public index(docs: Doc[]): void {
    this.bitIndex.build(docs);
    this.metricIndex.build(this.bitIndex.width, this.bitIndex.positionalDocs());
    this.wildcardResolver.index(this.bitIndex.indexedTerms());
  }

  public add(docs: Doc[]): void {
    this.bitIndex.add(docs).forEach(term => this.wildcardResolver.add(term));
    this.metricIndex.build(this.bitIndex.width, this.bitIndex.positionalDocs());
  }

  public update(updates: readonly TermUpdate<Doc>[]): void {
    const { added, removed } = this.bitIndex.update(updates);

    added.forEach(term => this.wildcardResolver.add(term));
    removed.forEach(term => this.wildcardResolver.remove(term));
    this.metricIndex.build(this.bitIndex.width, this.bitIndex.positionalDocs());
  }

  public termsForDoc(doc: Doc): ReadonlySet<string> {
    return this.bitIndex.termsForDoc(doc);
  }

  private bitSetFromQuery(query?: string): BitSet | undefined {
    if (query === undefined) {
      return undefined;
    }
    const expression = tryParseSearchExpression(query);
    return expression === undefined ? undefined : this.evaluator.evaluateToBitSet(expression);
  }
}
