import { WildcardMatchType, WildcardSearchTerm } from "@/lib/search/terms/wildcard_search_term";
import { PrefixIndex } from "@/lib/search/indexes/prefix_index";
import { TrigramIndex } from "@/lib/search/indexes/trigram_index";

export class WildcardIndex {
  private prefixIndex: PrefixIndex;
  private trigrams: TrigramIndex | null = null;
  private readonly eager: boolean;

  constructor(terms: string[] = [], eager: boolean = false) {
    this.eager = eager;
    this.prefixIndex = new PrefixIndex(terms);

    if (eager) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this.trigramIndex;
    }
  }

  private get trigramIndex(): TrigramIndex {
    this.trigrams ??= new TrigramIndex(this.prefixIndex.all());
    return this.trigrams;
  }

  public index(terms: string[]): void {
    this.prefixIndex = new PrefixIndex(terms);
    this.trigrams = this.eager ? new TrigramIndex(terms) : null;
  }

  public matchingTerms(term: WildcardSearchTerm): string[] {
    const inputs = term.resolutionInputs;

    switch (inputs.matchType) {
      case WildcardMatchType.Prefix:
        return this.prefixIndex.termsMatchingPrefix(inputs.fragment);
      case WildcardMatchType.Suffix:
        return this.trigramIndex.termsMatching(inputs.fragment, this.prefixIndex.all()).filter(key => key.endsWith(inputs.fragment));
      case WildcardMatchType.Substring:
        return this.trigramIndex.termsMatching(inputs.fragment, this.prefixIndex.all()).filter(key => key.includes(inputs.fragment));
      default:
        return this.trigramIndex.termsMatchingAll(inputs.fragments, this.prefixIndex.all()).filter(key => inputs.regex.test(key));
    }
  }

  public add(term: string): void {
    this.prefixIndex.add(term);
    this.trigrams?.add(term);
  }

  public remove(term: string): void {
    this.prefixIndex.remove(term);
    this.trigrams?.remove(term);
  }
}
