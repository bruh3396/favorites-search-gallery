import { WildcardMatchType } from "@/core/domain/search/terms/wildcard_match_type";
import { WildcardSearchTerm } from "@/core/domain/search/terms/wildcard_search_term";
import { PrefixIndex } from "@/core/domain/search/indexes/prefix_index";
import { SortedArray } from "@/core/utils/collection/sorted_array";
import { StringInterner } from "@/core/utils/string/string_interner";
import { TrigramIndex } from "@/core/domain/search/indexes/trigram_index";
import { compareStrings } from "@/core/utils/string/string_utilities";

export class WildcardIndex {
  private terms: SortedArray<string>;
  private prefixIndex: PrefixIndex;
  private trigramIndex: TrigramIndex;

  constructor(private readonly stringInterner: StringInterner, terms: string[] = []) {
    this.terms = new SortedArray<string>((a, b) => compareStrings(a, b), terms);
    this.prefixIndex = new PrefixIndex(this.terms);
    this.trigramIndex = new TrigramIndex(this.terms, this.stringInterner);
  }

  public index(terms: string[]): void {
    this.terms = new SortedArray<string>((a, b) => compareStrings(a, b), terms);
    this.prefixIndex = new PrefixIndex(this.terms);
    this.trigramIndex = new TrigramIndex(this.terms, this.stringInterner);
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
    this.trigramIndex.add(term);
  }

  public remove(term: string): void {
    this.terms.remove(term);
    this.trigramIndex.remove(term);
  }
}
