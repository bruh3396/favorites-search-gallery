import { AbstractTag } from "./abstract_tag";
import { Searchable } from "../../../types/search";
import { WildcardMatchType } from "../types/search_types";

export class WildcardTag extends AbstractTag {
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

  public getMatchingTags(tags: string[]): string[] {
    switch (this.matchType) {
      case WildcardMatchType.Prefix: return this.getMatchingTagsPrefix(tags);
      case WildcardMatchType.Includes: return this.getMatchingTagsIncludes(tags);
      default: return this.getMatchingTagsRegex(tags);
    }
  }

  protected override matchesPositive(item: Searchable): boolean {
    switch (this.matchType) {
      case WildcardMatchType.Prefix: return this.matchesPrefix(item);
      case WildcardMatchType.Includes: return this.matchesIncludes(item);
      default: return this.matchesRegex(item);
    }
  }

  protected override matchesNegated(item: Searchable): boolean {
    return !this.matchesPositive(item);
  }

  private optimize(): void {
    this.matchesPositive = this.matchType === WildcardMatchType.Prefix ? this.matchesPrefix : this.matchType === WildcardMatchType.Includes ? this.matchesIncludes : this.matchesRegex;
    this.matches = this.negated ? this.matchesNegated : this.matchesPositive;
  }

  private findFirstPrefixMatchIndex(tags: string[]): number {
    let lo = 0;
    let hi = tags.length - 1;

    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;

      if (tags[mid] < this.prefix) {
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return lo;
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

  private getMatchingTagsPrefix(tags: string[]): string[] {
    const result: string[] = [];
    const lo = this.findFirstPrefixMatchIndex(tags);

    for (let i = lo; i < tags.length; i += 1) {
      if (tags[i].startsWith(this.prefix)) {
        result.push(tags[i]);
      } else if (tags[i] > this.prefix) {
        break;
      }
    }
    return result;
  }

  private getMatchingTagsIncludes(tags: string[]): string[] {
    return tags.filter(tag => tag.includes(this.substring));
  }

  private getMatchingTagsRegex(tags: string[]): string[] {
    return tags.filter(tag => this.regex.test(tag));
  }
}
