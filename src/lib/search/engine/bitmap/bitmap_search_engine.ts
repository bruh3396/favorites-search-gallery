import { Searchable, SearchableMetric } from "@/types/search";
import { BitmapIndex } from "@/lib/search/engine/bitmap/bitmap_index";
import { BitmapSearcher } from "@/lib/search/engine/bitmap/bitmap_searcher";
import { MetricBitmapIndex } from "@/lib/search/engine/bitmap/metric_bitmap_index";
import { SearchEngine } from "@/lib/search/engine/search_engine";
import { WildcardTermResolver } from "@/lib/search/engine/set/wildcard_term_resolver";
import { isEmptyString } from "@/utils/pure/string";
import { parseSearchQuery } from "@/lib/search/parsers/search_term_group_parser";

export class BitmapSearchEngine<Doc extends Searchable> implements SearchEngine<Doc> {
  private readonly bitmapIndex: BitmapIndex<Doc>;
  private readonly metricIndex: MetricBitmapIndex<Doc>;
  private readonly wildcardResolver = new WildcardTermResolver();
  private readonly searcher: BitmapSearcher<Doc>;
  constructor(
    termsFor: (doc: Doc) => Iterable<string>,
    metricFor: (doc: Doc, metric: SearchableMetric) => number = () => 0,
    docs: Doc[] = []
  ) {
    this.bitmapIndex = new BitmapIndex<Doc>(termsFor);
    this.metricIndex = new MetricBitmapIndex<Doc>(metricFor);
    this.searcher = new BitmapSearcher<Doc>(this.bitmapIndex, this.metricIndex, this.wildcardResolver);
    this.index(docs);
  }

  public search(query: string, candidates?: Doc[]): Doc[] {
    if (isEmptyString(query)) {
      return this.bitmapIndex.allDocs();
    }
    const matches = this.searcher.search(parseSearchQuery<Doc>(query));

    if (candidates === undefined || candidates.length === this.bitmapIndex.size) {
      return matches;
    }
    const allowed = new Set(candidates);
    return matches.filter(doc => allowed.has(doc));
  }

  public index(docs: Doc[]): void {
    this.bitmapIndex.build(docs);
    this.metricIndex.build(this.bitmapIndex.width, this.bitmapIndex.positionalDocs());
    this.wildcardResolver.index(this.bitmapIndex.indexedTerms().sort());
  }

  public add(doc: Doc): void {
    this.bitmapIndex.add(doc).forEach(term => this.wildcardResolver.addTerm(term));
    this.metricIndex.build(this.bitmapIndex.width, this.bitmapIndex.positionalDocs());
  }

  public remove(doc: Doc): void {
    this.bitmapIndex.remove(doc).forEach(term => this.wildcardResolver.removeTerm(term));
    this.metricIndex.build(this.bitmapIndex.width, this.bitmapIndex.positionalDocs());
  }
}
