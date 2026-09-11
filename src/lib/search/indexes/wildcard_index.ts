import { WildcardMatchType, WildcardSearchTerm } from "@/lib/search/terms/wildcard_search_term";
import { PrefixIndex } from "@/lib/search/indexes/prefix_index";
import { SortedArray } from "@/lib/collection/sorted_array";
import { TrigramIndex } from "@/lib/search/indexes/trigram_index";
import { compareStrings } from "@/utils/pure/string";

export class WildcardIndex {
  private readonly eager: boolean;
  private terms: SortedArray<string>;
  private prefixIndex: PrefixIndex;
  private trigrams: TrigramIndex | null = null;

  constructor(terms: string[] = [], eager: boolean = true) {
    this.eager = eager;
    this.terms = new SortedArray<string>((a, b) => compareStrings(a, b), terms);
    this.prefixIndex = new PrefixIndex(this.terms);

    if (eager) {
      this.trigrams = new TrigramIndex(this.terms);
    }
  }

  private get trigramIndex(): TrigramIndex {
    this.trigrams ??= new TrigramIndex(this.terms);
    return this.trigrams;
  }

  public index(terms: string[]): void {
    this.terms = new SortedArray<string>((a, b) => compareStrings(a, b), terms);
    this.prefixIndex = new PrefixIndex(this.terms);
    this.trigrams = this.eager ? new TrigramIndex(this.terms) : null;
  }

  public matchingTerms(term: WildcardSearchTerm): string[] {
    const inputs = term.resolutionInputs;

    switch (inputs.matchType) {
      case WildcardMatchType.Prefix:
        return this.prefixIndex.termsMatchingPrefix(inputs.fragment);
      case WildcardMatchType.Suffix:
        return this.trigramIndex.termsMatching(inputs.fragment).filter(key => key.endsWith(inputs.fragment));
      case WildcardMatchType.Substring:
        return this.trigramIndex.termsMatching(inputs.fragment).filter(key => key.includes(inputs.fragment));
      default:
        return this.trigramIndex.termsMatchingAll(inputs.fragments).filter(key => inputs.regex.test(key));
    }
  }

  public add(term: string): void {
    this.terms.add(term);
    this.trigrams?.add(term);
  }

  public remove(term: string): void {
    this.terms.remove(term);
    this.trigrams?.remove(term);
  }
}
