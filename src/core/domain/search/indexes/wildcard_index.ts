import { PrefixIndex } from "@/core/domain/search/indexes/prefix_index";
import { SortedArray } from "@/core/utils/collection/sorted_array";
import { StringInterner } from "@/core/utils/string/string_interner";
import { TrigramIndex } from "@/core/domain/search/indexes/trigram_index";
import { WildcardMatchType } from "@/core/domain/search/terms/wildcard_match_type";
import { WildcardSearchTerm } from "@/core/domain/search/terms/wildcard_search_term";
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

  public getTermsStartingWith(prefix: string): string[] {
    return this.prefixIndex.getTermsStartingWith(prefix);
  }

  public matchingTerms(wildcardSearchTerm: WildcardSearchTerm): string[] {
    const wildcardResolutionInputs = wildcardSearchTerm.resolutionInputs;

    switch (wildcardResolutionInputs.matchType) {
      case WildcardMatchType.Prefix:
        return this.prefixIndex.getTermsStartingWith(wildcardResolutionInputs.fragment);
      case WildcardMatchType.Suffix:
        return this.trigramIndex.termsMatching(wildcardResolutionInputs.fragment).filter(key => key.endsWith(wildcardResolutionInputs.fragment));
      case WildcardMatchType.Substring:
        return this.trigramIndex.termsMatching(wildcardResolutionInputs.fragment).filter(key => key.includes(wildcardResolutionInputs.fragment));
      default:
        return this.trigramIndex.termsMatchingAll(wildcardResolutionInputs.fragments).filter(key => wildcardResolutionInputs.regex.test(key));
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
