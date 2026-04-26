import { AbstractSearchTag } from "./abstract_search_tag";
import { Searchable } from "../../../types/common_types";
import { WildcardMatchType } from "../types/search_types";

export const UNMATCHABLE_REGEX = /^\b$/;
export const STARTS_WITH_REGEX = /^[^*]*\*$/;
export const CONTAINS_REGEX = /^\*[^*]*\*$/;

export class WildcardSearchTag extends AbstractSearchTag {
  protected readonly baseCost: number;
  private readonly matchType: WildcardMatchType;
  private readonly matchRegex: RegExp;
  private readonly startsWithPrefix: string;
  private readonly containsSubstring: string;

  constructor(value: string, negated: boolean, matchType: WildcardMatchType, matchRegex: RegExp, startsWithPrefix: string, containsSubstring: string) {
    super(value, negated);
    this.baseCost = matchType;
    this.matchType = matchType;
    this.matchRegex = matchRegex;
    this.startsWithPrefix = startsWithPrefix;
    this.containsSubstring = containsSubstring;
    this.optimize();
  }

  public getMatchingTags(tags: string[]): string[] {
    switch (this.matchType) {
      case WildcardMatchType.STARTS_WITH: return this.getMatchingTagsStartsWith(tags);
      case WildcardMatchType.CONTAINS: return this.getMatchingTagsContains(tags);
      default: return this.getMatchingTagsRegex(tags);
    }
  }

  protected override matchesPositive(item: Searchable): boolean {
    switch (this.matchType) {
      case WildcardMatchType.STARTS_WITH: return this.matchesStartsWith(item);
      case WildcardMatchType.CONTAINS: return this.matchesContains(item);
      default: return this.matchesRegex(item);
    }
  }

  protected override matchesNegated(item: Searchable): boolean {
    return !this.matchesPositive(item);
  }

  private optimize(): void {
    this.matchesPositive = this.matchType === WildcardMatchType.STARTS_WITH ? this.matchesStartsWith : this.matchType === WildcardMatchType.CONTAINS ? this.matchesContains : this.matchesRegex;
    this.matches = this.negated ? this.matchesNegated : this.matchesPositive;
  }

  private findStartsWithIndex(tags: string[]): number {
    let lo = 0;
    let hi = tags.length - 1;

    while (lo <= hi) {
      // eslint-disable-next-line no-bitwise
      const mid = (lo + hi) >>> 1;

      if (tags[mid] < this.startsWithPrefix) {
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return lo;
  }

  private matchesStartsWith(item: Searchable): boolean {
    for (const tag of item.tags.values()) {
      if (tag.startsWith(this.startsWithPrefix)) {
        return true;
      }

      if (this.startsWithPrefix < tag) {
        break;
      }
    }
    return false;
  }

  private matchesContains(item: Searchable): boolean {
    for (const tag of item.tags.values()) {
      if (tag.includes(this.containsSubstring)) {
        return true;
      }
    }
    return false;
  }

  private matchesRegex(item: Searchable): boolean {
    for (const tag of item.tags.values()) {
      if (this.matchRegex.test(tag)) {
        return true;
      }
    }
    return false;
  }

  private getMatchingTagsStartsWith(tags: string[]): string[] {
    const result: string[] = [];
    const lo = this.findStartsWithIndex(tags);

    for (let i = lo; i < tags.length; i += 1) {
      if (tags[i].startsWith(this.startsWithPrefix)) {
        result.push(tags[i]);
      } else if (tags[i] > this.startsWithPrefix) {
        break;
      }
    }
    return result;
  }

  private getMatchingTagsContains(tags: string[]): string[] {
    return tags.filter(tag => tag.includes(this.containsSubstring));
  }

  private getMatchingTagsRegex(tags: string[]): string[] {
    return tags.filter(tag => this.matchRegex.test(tag));
  }
}
