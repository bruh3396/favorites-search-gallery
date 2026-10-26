import { SearchTerm } from "@/core/domain/search/terms/search_term";
import { ParsedTerm } from "@/core/domain/search/terms/parsed_term";
import { Searchable } from "@/core/domain/search/searchable";
import { WildcardMatchType } from "@/core/domain/search/terms/wildcard_match_type";
import { WildcardPattern } from "@/core/domain/search/terms/wildcard_pattern";
import { WildcardResolutionInputs } from "@/core/domain/search/terms/wildcard_resolution_inputs";

export class WildcardSearchTerm extends SearchTerm {
  public readonly matchType: WildcardMatchType;
  protected override readonly baseCost: number;
  private readonly regex: RegExp;
  private readonly prefix: string;
  private readonly substring: string;

  constructor(parsed: ParsedTerm, { matchType, regex }: WildcardPattern) {
    super(parsed);
    this.baseCost = matchType;
    this.matchType = matchType;
    this.regex = regex;
    this.prefix = parsed.value.slice(0, -1);
    this.substring = parsed.value.slice(1, -1);
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
