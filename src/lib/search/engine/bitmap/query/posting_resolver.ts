import { DensePosting, EMPTY_POSTING, Posting } from "@/lib/search/engine/bitmap/bits/posting";
import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { BitmapIndex } from "@/lib/search/engine/bitmap/indexes/index";
import { MetricBitmapIndex } from "@/lib/search/engine/bitmap/indexes/metric_index";
import { MetricSearchTerm } from "@/lib/search/terms/metric_search_term";
import { Searchable } from "@/types/search";
import { WildcardPostingResolver } from "@/lib/search/engine/bitmap/wildcard/posting_resolver";
import { WildcardSearchTerm } from "@/lib/search/terms/wildcard_search_term";

export class PostingResolver<Doc extends Searchable> {
  constructor(
    private readonly bitmapIndex: BitmapIndex<Doc>,
    private readonly metricIndex: MetricBitmapIndex<Doc>,
    private readonly wildcardResolver: WildcardPostingResolver
  ) { }

  public resolve(term: AbstractSearchTerm): Posting {
    if (term instanceof WildcardSearchTerm) {
      return this.wildcardResolver.resolve(term) ?? EMPTY_POSTING;
    }

    if (term instanceof MetricSearchTerm) {
      return new DensePosting(this.metricIndex.bitsetFor(term.comparison));
    }
    return this.bitmapIndex.postingForTerm(term.value) ?? EMPTY_POSTING;
  }
}
