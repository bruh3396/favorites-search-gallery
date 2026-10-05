import { DensePosting, Posting } from "@/core/search/engines/bit/postings/posting";
import { BitIndex } from "@/core/search/engines/bit/indexes/bit_index";
import { WildcardResolver } from "@/core/search/indexes/wildcard_resolver";

export class WildcardPostingResolver<Doc> extends WildcardResolver<Posting | undefined> {
  constructor(private readonly bitIndex: BitIndex<Doc>) {
    super();
  }

  protected combine(matches: string[]): Posting | undefined {
    const postings = this.postingsForTerms(matches);
    return postings.length === 0 ? undefined : new DensePosting(this.bitIndex.unionOf(postings));
  }

  private postingsForTerms(terms: string[]): Posting[] {
    const postings: Posting[] = [];

    for (const term of terms) {
      const posting = this.bitIndex.findPosting(term);

      if (posting !== undefined) {
        postings.push(posting);
      }
    }
    return postings;
  }
}
