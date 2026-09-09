import { SearchEngine, TermUpdate } from "@/lib/search/search_engine";
import { Searchable, SearchableMetric } from "@/types/search";
import { BitmapEvaluator } from "@/lib/search/bitmap/logic/bitmap_evaluator";
import { BitmapIndex } from "@/lib/search/bitmap/indexes/bitmap_index";
import { MetricBitmapIndex } from "@/lib/search/bitmap/indexes/metric_index";
import { PostingResolver } from "@/lib/search/bitmap/logic/posting_resolver";
import { WildcardPostingResolver } from "@/lib/search/bitmap/resolution/wildcard_posting_resolver";
import { tryParseSearchExpression } from "@/lib/search/parsers/search_expression_parser";

export class BitmapSearchEngine<Doc extends Searchable> implements SearchEngine<Doc> {
  private readonly bitmapIndex: BitmapIndex<Doc>;
  private readonly metricIndex: MetricBitmapIndex<Doc>;
  private readonly wildcardResolver: WildcardPostingResolver<Doc>;
  private readonly evaluator: BitmapEvaluator<Doc>;

  constructor(termsFor: (doc: Doc) => Iterable<string>, metricFor: (doc: Doc, metric: SearchableMetric) => number = () => 0, docs: Doc[] = []) {
    this.bitmapIndex = new BitmapIndex<Doc>(termsFor);
    this.metricIndex = new MetricBitmapIndex<Doc>(metricFor);
    this.wildcardResolver = new WildcardPostingResolver(this.bitmapIndex);
    this.evaluator = new BitmapEvaluator(this.bitmapIndex, new PostingResolver(this.bitmapIndex, this.metricIndex, this.wildcardResolver));
    this.index(docs);
  }

  public search(query: string, candidates?: Doc[]): Doc[] {
    const expression = tryParseSearchExpression(query);

    if (expression === undefined) {
      return [];
    }
    const matches = this.evaluator.evaluate(expression);

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
}
