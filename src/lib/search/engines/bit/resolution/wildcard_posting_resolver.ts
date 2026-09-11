import { DensePosting, Posting } from "@/lib/search/engines/bit/postings/posting";
import { BitIndex } from "@/lib/search/engines/bit/indexes/bit_index";
import { WildcardResolver } from "@/lib/search/indexes/wildcard_resolver";

export class WildcardPostingResolver<Doc> extends WildcardResolver<Posting | undefined> {
  constructor(private readonly bitIndex: BitIndex<Doc>) {
    super();
  }

  protected combine(matches: string[]): Posting | undefined {
    const postings = this.postingsForTerm(matches);
    return postings.length === 0 ? undefined : new DensePosting(this.bitIndex.unionOfPostings(postings));
  }

  private postingsForTerm(terms: string[]): Posting[] {
    const postings: Posting[] = [];

    for (const term of terms) {
      const posting = this.bitIndex.postingFor(term);

      if (posting !== undefined) {
        postings.push(posting);
      }
    }
    return postings;
  }
}
