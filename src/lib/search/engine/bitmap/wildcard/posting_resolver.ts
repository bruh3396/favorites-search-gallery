import { Posting } from "@/lib/search/engine/bitmap/bits/posting";
import { WildcardMatcher } from "@/lib/search/indexes/wildcard_matcher";
import { WildcardSearchTerm } from "@/lib/search/terms/wildcard_search_term";

export class WildcardPostingResolver {
  private matcher = new WildcardMatcher<string>();
  private readonly cache = new Map<string, Posting | null>();

  constructor(
    private readonly unionize: (postings: Posting[]) => Posting,
    private readonly postingFor: (term: string) => Posting | undefined
  ) { }

  public index(terms: string[]): void {
    this.matcher = new WildcardMatcher<string>(undefined, terms);
    this.cache.clear();
  }

  public add(term: string): void {
    this.matcher.add(term);
    this.cache.clear();
  }

  public remove(term: string): void {
    this.matcher.remove(term);
    this.cache.clear();
  }

  public resolve(term: WildcardSearchTerm): Posting | undefined {
    const key = term.resolutionInputs.regex.source;
    const cached = this.cache.get(key);

    if (cached !== undefined) {
      return cached ?? undefined;
    }
    const postings = this.postingsForMatches(this.matcher.match(term));
    const union = postings.length === 0 ? null : this.unionize(postings);

    this.cache.set(key, union);
    return union ?? undefined;
  }

  private postingsForMatches(terms: string[]): Posting[] {
    const postings: Posting[] = [];

    for (const term of terms) {
      const posting = this.postingFor(term);

      if (posting !== undefined) {
        postings.push(posting);
      }
    }
    return postings;
  }
}
