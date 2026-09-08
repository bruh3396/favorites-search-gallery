import { DensePosting, Posting } from "@/lib/search/engine/bitmap/bits/posting";
import { Searchable, SearchableMetric } from "@/types/search";
import { BitmapIndex } from "@/lib/search/engine/bitmap/indexes/index";
import { ExpressionContext } from "@/lib/search/engine/bitmap/query/expression";
import { MetricBitmapIndex } from "@/lib/search/engine/bitmap/indexes/metric_index";
import { SearchEngine } from "@/lib/search/engine/search_engine";
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
    this.wildcardResolver = new WildcardPostingResolver((postings: Posting[]) => new DensePosting(this.bitmapIndex.unionOfPostings(postings)));
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
    const allowed = new Set(candidates);
    return matches.filter(doc => allowed.has(doc));
  }

  public index(docs: Doc[]): void {
    this.bitmapIndex.build(docs);
    this.metricIndex.build(this.bitmapIndex.width, this.bitmapIndex.positionalDocs());
    this.wildcardResolver.index(this.bitmapIndex.postingEntries());
  }

  public add(doc: Doc): void {
    this.refreshWildcards(this.bitmapIndex.add(doc));
    this.metricIndex.build(this.bitmapIndex.width, this.bitmapIndex.positionalDocs());
  }

  public remove(doc: Doc): void {
    this.refreshWildcards(this.bitmapIndex.remove(doc));
    this.metricIndex.build(this.bitmapIndex.width, this.bitmapIndex.positionalDocs());
  }

  private refreshWildcards(affectedTerms: string[]): void {
    for (const term of affectedTerms) {
      this.wildcardResolver.refresh(term, this.bitmapIndex.postingForTerm(term));
    }
  }

  private expressionContext(): ExpressionContext<Doc> {
    return { bitmapIndex: this.bitmapIndex, metricIndex: this.metricIndex, wildcardResolver: this.wildcardResolver };
  }
}
