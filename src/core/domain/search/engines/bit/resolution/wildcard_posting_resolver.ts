import { DensePosting, Posting } from "@/core/domain/search/engines/bit/posting/posting";
import { BitIndex } from "@/core/domain/search/engines/bit/indexes/bit_index";
import { StringInterner } from "@/core/utils/string/string_interner";
import { WildcardResolver } from "@/core/domain/search/indexes/wildcard_resolver";

export interface WildcardPostingResolverDependencies<Doc> {
  bitIndex: BitIndex<Doc>;
  stringInterner: StringInterner;
}

export class WildcardPostingResolver<Doc> extends WildcardResolver<Posting | undefined> {
  private readonly bitIndex: BitIndex<Doc>;

  constructor({ bitIndex, stringInterner }: WildcardPostingResolverDependencies<Doc>) {
    super(stringInterner);
    this.bitIndex = bitIndex;
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
