import { DensePosting, Posting } from "@/lib/search/bitmap/postings/posting";
import { BitmapIndex } from "@/lib/search/bitmap/indexes/bitmap_index";
import { WildcardResolver } from "@/lib/search/indexes/wildcard_resolver";

export class WildcardPostingResolver<Doc> extends WildcardResolver<Posting | undefined> {
  constructor(private readonly bitmapIndex: BitmapIndex<Doc>) {
    super();
  }

  protected combine(matches: string[]): Posting | undefined {
    const postings = this.postingsForTerm(matches);
    return postings.length === 0 ? undefined : new DensePosting(this.bitmapIndex.unionOfPostings(postings));
  }

  private postingsForTerm(terms: string[]): Posting[] {
    const postings: Posting[] = [];

    for (const term of terms) {
      const posting = this.bitmapIndex.postingForTerm(term);

      if (posting !== undefined) {
        postings.push(posting);
      }
    }
    return postings;
  }
}
