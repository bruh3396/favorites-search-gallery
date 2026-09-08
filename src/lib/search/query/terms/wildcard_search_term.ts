import { AbstractSearchTerm } from "@/lib/search/query/terms/abstract_search_term";
import { Searchable } from "@/types/search";

export enum WildcardMatchType {
  Prefix = 10,
  Suffix = 15,
  Substring = 20,
  MultiStar = 25
}

export interface WildcardResolutionInputs {
  matchType: WildcardMatchType;
  fragment: string;
  fragments: string[];
  regex: RegExp;
}

export class WildcardSearchTerm extends AbstractSearchTerm {
  public readonly matchType: WildcardMatchType;
  protected override readonly baseCost: number;
  private readonly regex: RegExp;
  private readonly prefix: string;
  private readonly substring: string;

  constructor(value: string, isNegated: boolean, matchType: WildcardMatchType, regex: RegExp) {
    super(value, isNegated);
    this.baseCost = matchType;
    this.matchType = matchType;
    this.regex = regex;
    this.prefix = value.slice(0, -1);
    this.substring = value.slice(1, -1);
    this.optimize();
  }

  public get resolutionInputs(): WildcardResolutionInputs {
    return {
      matchType: this.matchType,
      fragment: this.fragment(),
      fragments: this.value.split("*").filter(fragment => fragment !== ""),
      regex: this.regex
    };
  }

  protected override matchesPositive(item: Searchable): boolean {
    switch (this.matchType) {
      case WildcardMatchType.Prefix: return this.matchesPrefix(item);
      case WildcardMatchType.Substring: return this.matchesSubstring(item);
      default: return this.matchesRegex(item);
    }
  }

  protected override matchesNegated(item: Searchable): boolean {
    return !this.matchesPositive(item);
  }

  private fragment(): string {
    switch (this.matchType) {
      case WildcardMatchType.Prefix: return this.prefix;
      case WildcardMatchType.Suffix: return this.value.slice(1);
      case WildcardMatchType.Substring: return this.substring;
      default: return "";
    }
  }

  private optimize(): void {
    this.matchesPositive = this.matchType === WildcardMatchType.Prefix ? this.matchesPrefix : this.matchType === WildcardMatchType.Substring ? this.matchesSubstring : this.matchesRegex;
    this.matches = this.isNegated ? this.matchesNegated : this.matchesPositive;
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

  private matchesSubstring(item: Searchable): boolean {
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
}
