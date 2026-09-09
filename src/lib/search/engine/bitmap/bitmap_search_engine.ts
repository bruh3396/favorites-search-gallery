import { DensePosting, Posting } from "@/lib/search/engine/bitmap/bits/posting";
import { SearchEngine, TermUpdate } from "@/lib/search/engine/search_engine";
import { Searchable, SearchableMetric } from "@/types/search";
import { BitmapIndex } from "@/lib/search/engine/bitmap/indexes/index";
import { ExpressionContext } from "@/lib/search/engine/bitmap/query/expression";
import { MetricBitmapIndex } from "@/lib/search/engine/bitmap/indexes/metric_index";
import { WildcardPostingResolver } from "@/lib/search/engine/bitmap/wildcard/posting_resolver";
import { tryParseSearchExpression } from "@/lib/search/query/parsers/search_expression_parser";

export class BitmapSearchEngine<Doc extends Searchable> implements SearchEngine<Doc> {
  private readonly bitmapIndex: BitmapIndex<Doc>;
  private readonly metricIndex: MetricBitmapIndex<Doc>;
  private readonly wildcardResolver: WildcardPostingResolver;

  constructor(
    termsFor: (doc: Doc) => Iterable<string>,
    metricFor: (doc: Doc, metric: SearchableMetric) => number = () => 0,
    docs: Doc[] = []
  ) {
    this.bitmapIndex = new BitmapIndex<Doc>(termsFor);
    this.metricIndex = new MetricBitmapIndex<Doc>(metricFor);
    this.wildcardResolver = new WildcardPostingResolver(
      (postings: Posting[]) => new DensePosting(this.bitmapIndex.unionOfPostings(postings)),
      (term: string) => this.bitmapIndex.postingForTerm(term)
    );
    this.index(docs);
  }

  public search(query: string, candidates?: Doc[]): Doc[] {
    const expression = tryParseSearchExpression(query);

    if (expression === undefined) {
      return [];
    }
    const matches = expression.evaluate(this.expressionContext());

    if (candidates === undefined || candidates.length === this.bitmapIndex.size) {
      return matches;
    }
    const candidateSet = new Set(candidates);
    return matches.filter(doc => candidateSet.has(doc));
  }

  public index(docs: Doc[]): void {
    this.bitmapIndex.build(docs);
    this.metricIndex.build(this.bitmapIndex.width, this.bitmapIndex.positionalDocs());
    this.wildcardResolver.index(this.bitmapIndex.indexedTerms());
  }

  public add(docs: Doc[]): void {
    this.bitmapIndex.add(docs).forEach(term => this.wildcardResolver.add(term));
    this.metricIndex.build(this.bitmapIndex.width, this.bitmapIndex.positionalDocs());
  }

  public update(updates: readonly TermUpdate<Doc>[]): void {
    const { added, removed } = this.bitmapIndex.update(updates);

    added.forEach(term => this.wildcardResolver.add(term));
    removed.forEach(term => this.wildcardResolver.remove(term));
    this.metricIndex.build(this.bitmapIndex.width, this.bitmapIndex.positionalDocs());
  }

  private expressionContext(): ExpressionContext<Doc> {
    return { bitmapIndex: this.bitmapIndex, metricIndex: this.metricIndex, wildcardResolver: this.wildcardResolver };
  }
}
