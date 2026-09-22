import { DensePosting, EMPTY_POSTING, Posting } from "@/lib/search/engines/bit/postings/posting";
import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { BitIndex } from "@/lib/search/engines/bit/indexes/bit_index";
import { MetricBitIndex } from "@/lib/search/engines/bit/indexes/metric_index";
import { MetricSearchTerm } from "@/lib/search/terms/metric_search_term";
import { NumericSearchTerm } from "@/lib/search/terms/numeric_search_term";
import { WildcardPostingResolver } from "@/lib/search/engines/bit/resolution/wildcard_posting_resolver";
import { WildcardSearchTerm } from "@/lib/search/terms/wildcard_search_term";

export class PostingResolver<Doc> {
  constructor(
    private readonly bitIndex: BitIndex<Doc>,
    private readonly metricIndex: MetricBitIndex<Doc>,
    private readonly wildcardResolver: WildcardPostingResolver<Doc>
  ) { }

  public resolve(term: AbstractSearchTerm): Posting {
    if (term instanceof NumericSearchTerm) {
      return this.postingForNumeric(term);
    }

    if (term instanceof WildcardSearchTerm) {
      return this.wildcardResolver.resolve(term) ?? EMPTY_POSTING;
    }

    if (term instanceof MetricSearchTerm) {
      return this.metricIndex.postingFor(term.comparison);
    }
    return this.bitIndex.postingFor(term.value) ?? EMPTY_POSTING;
  }

  private postingForNumeric(term: NumericSearchTerm): Posting {
    const taggedPosting = this.bitIndex.postingFor(term.value) ?? EMPTY_POSTING;
    const idPosting = this.metricIndex.postingFor(term.idComparison);
    return new DensePosting(this.bitIndex.unionOf([taggedPosting, idPosting]));
  }
}
