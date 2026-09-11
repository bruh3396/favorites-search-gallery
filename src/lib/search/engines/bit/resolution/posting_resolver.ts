import { EMPTY_POSTING, Posting } from "@/lib/search/engines/bit/postings/posting";
import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { BitIndex } from "@/lib/search/engines/bit/indexes/bit_index";
import { MetricBitIndex } from "@/lib/search/engines/bit/indexes/metric_index";
import { MetricSearchTerm } from "@/lib/search/terms/metric_search_term";
import { WildcardPostingResolver } from "@/lib/search/engines/bit/resolution/wildcard_posting_resolver";
import { WildcardSearchTerm } from "@/lib/search/terms/wildcard_search_term";

export class PostingResolver<Doc> {
  constructor(
    private readonly bitIndex: BitIndex<Doc>,
    private readonly metricIndex: MetricBitIndex<Doc>,
    private readonly wildcardResolver: WildcardPostingResolver<Doc>
  ) { }

  public resolve(term: AbstractSearchTerm): Posting {
    if (term instanceof WildcardSearchTerm) {
      return this.wildcardResolver.resolve(term) ?? EMPTY_POSTING;
    }

    if (term instanceof MetricSearchTerm) {
      return this.metricIndex.postingFor(term.comparison);
    }
    return this.bitIndex.postingFor(term.value) ?? EMPTY_POSTING;
  }
}
