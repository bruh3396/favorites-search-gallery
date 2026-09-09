import { WildcardMatchType, WildcardSearchTerm } from "@/lib/search/terms/wildcard_search_term";
import { PrefixIndex } from "@/lib/search/indexes/prefix_index";
import { TrigramIndex } from "@/lib/search/indexes/trigram_index";

export class WildcardIndex {
  private prefixes: PrefixIndex;
  private trigrams: TrigramIndex;

  constructor(terms: string[] = []) {
    this.prefixes = new PrefixIndex(terms);
    this.trigrams = new TrigramIndex(terms);
  }

  public index(terms: string[]): void {
    this.prefixes = new PrefixIndex(terms);
    this.trigrams = new TrigramIndex(terms);
  }

  public matchingTerms(term: WildcardSearchTerm): string[] {
    const inputs = term.resolutionInputs;

    switch (inputs.matchType) {
      case WildcardMatchType.Prefix:
        return this.prefixes.matchingPrefix(inputs.fragment);
      case WildcardMatchType.Suffix:
        return this.trigrams.matching(inputs.fragment, this.prefixes.all()).filter(key => key.endsWith(inputs.fragment));
      case WildcardMatchType.Substring:
        return this.trigrams.matching(inputs.fragment, this.prefixes.all()).filter(key => key.includes(inputs.fragment));
      default:
        return this.trigrams.matchingAll(inputs.fragments, this.prefixes.all()).filter(key => inputs.regex.test(key));
    }
  }

  public add(term: string): void {
    this.prefixes.add(term);
    this.trigrams.add(term);
  }

  public remove(term: string): void {
    this.prefixes.remove(term);
    this.trigrams.remove(term);
  }
}
