import { AbstractSearchTerm } from "./abstract_search_term";
import { Searchable } from "../../../types/search";
import { WildcardMatchType } from "../types/search_types";

export class WildcardSearchTerm extends AbstractSearchTerm {
  protected override readonly baseCost: number;
  private readonly matchType: WildcardMatchType;
  private readonly regex: RegExp;
  private readonly prefix: string;
  private readonly substring: string;

  constructor(value: string, negated: boolean, matchType: WildcardMatchType, regex: RegExp) {
    super(value, negated);
    this.baseCost = matchType;
    this.matchType = matchType;
    this.regex = regex;
    this.prefix = value.slice(0, -1);
    this.substring = value.slice(1, -1);
    this.optimize();
  }

  public findMatchingTerms(indexedTerms: string[]): string[] {
    switch (this.matchType) {
      case WildcardMatchType.Prefix: return this.findPrefixMatches(indexedTerms);
      case WildcardMatchType.Substring: return this.findSubstringMatches(indexedTerms);
      default: return this.findRegexMatches(indexedTerms);
    }
  }

  protected override matchesPositive(item: Searchable): boolean {
    switch (this.matchType) {
      case WildcardMatchType.Prefix: return this.matchesPrefix(item);
      case WildcardMatchType.Substring: return this.matchesIncludes(item);
      default: return this.matchesRegex(item);
    }
  }

  protected override matchesNegated(item: Searchable): boolean {
    return !this.matchesPositive(item);
  }

  private optimize(): void {
    this.matchesPositive = this.matchType === WildcardMatchType.Prefix ? this.matchesPrefix : this.matchType === WildcardMatchType.Substring ? this.matchesIncludes : this.matchesRegex;
    this.matches = this.negated ? this.matchesNegated : this.matchesPositive;
  }

  private matchesPrefix(item: Searchable): boolean {
    for (const tag of item.tags.values()) {
      if (tag.startsWith(this.prefix)) {
        return true;
      }

      if (this.prefix < tag) {
        break;
      }
    }
    return false;
  }

  private matchesIncludes(item: Searchable): boolean {
    for (const tag of item.tags.values()) {
      if (tag.includes(this.substring)) {
        return true;
      }
    }
    return false;
  }

  private matchesRegex(item: Searchable): boolean {
    for (const tag of item.tags.values()) {
      if (this.regex.test(tag)) {
        return true;
      }
    }
    return false;
  }

  private findPrefixMatches(indexedTerms: string[]): string[] {
    const result: string[] = [];
    const lo = this.findFirstPrefixMatchIndex(indexedTerms);

    for (let i = lo; i < indexedTerms.length; i += 1) {
      if (indexedTerms[i].startsWith(this.prefix)) {
        result.push(indexedTerms[i]);
      } else if (indexedTerms[i] > this.prefix) {
        break;
      }
    }
    return result;
  }

  private findSubstringMatches(indexedTerms: string[]): string[] {
    return indexedTerms.filter(term => term.includes(this.substring));
  }

  private findRegexMatches(indexedTerms: string[]): string[] {
    return indexedTerms.filter(term => this.regex.test(term));
  }

    private findFirstPrefixMatchIndex(terms: string[]): number {
    let lo = 0;
    let hi = terms.length - 1;

    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;

      if (terms[mid] < this.prefix) {
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return lo;
  }
}
