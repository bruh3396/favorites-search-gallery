import { DensePosting, EMPTY_POSTING, Posting } from "@/core/domain/search/engines/bit/posting/posting";
import { SearchTerm } from "@/core/domain/search/terms/search_term";
import { BitIndex } from "@/core/domain/search/engines/bit/indexes/bit_index";
import { MetricBitIndex } from "@/core/domain/search/engines/bit/indexes/metric_bit_index";
import { MetricSearchTerm } from "@/core/domain/search/terms/metric_search_term";
import { NumericSearchTerm } from "@/core/domain/search/terms/numeric_search_term";
import { WildcardPostingResolver } from "@/core/domain/search/engines/bit/resolution/wildcard_posting_resolver";
import { WildcardSearchTerm } from "@/core/domain/search/terms/wildcard_search_term";

export class PostingResolver<Doc> {
  constructor(
    private readonly bitIndex: BitIndex<Doc>,
    private readonly metricBitIndex: MetricBitIndex<Doc>,
    private readonly wildcardPostingResolver: WildcardPostingResolver<Doc>
  ) { }

  public resolve(searchTerm: SearchTerm): Posting {
    if (searchTerm instanceof NumericSearchTerm) {
      return this.postingForNumeric(searchTerm);
    }

    if (searchTerm instanceof WildcardSearchTerm) {
      return this.wildcardPostingResolver.resolve(searchTerm) ?? EMPTY_POSTING;
    }

    if (searchTerm instanceof MetricSearchTerm) {
      return this.metricBitIndex.getPosting(searchTerm.comparison);
    }
    return this.bitIndex.findPosting(searchTerm.value) ?? EMPTY_POSTING;
  }

  private postingForNumeric(numericSearchTerm: NumericSearchTerm): Posting {
    const taggedPosting = this.bitIndex.findPosting(numericSearchTerm.value) ?? EMPTY_POSTING;
    const idDensePosting = this.metricBitIndex.getPosting(numericSearchTerm.idMetricComparison);
    return new DensePosting(this.bitIndex.unionOf([taggedPosting, idDensePosting]));
  }
}
