import { AbstractSearchTag } from "./abstract_search_tag";
import { Searchable } from "../../../types/search";
import { WildcardMatchType } from "../types/search_types";

export class WildcardSearchTag extends AbstractSearchTag {
  protected override readonly baseCost: number;
  private readonly matchType: WildcardMatchType;
  private readonly regex: RegExp;
  private readonly prefix: string;
  private readonly substring: string;

  constructor(value: string, negated: boolean, matchType: WildcardMatchType, regex: RegExp, prefix: string, substring: string) {
    super(value, negated);
    this.baseCost = matchType;
    this.matchType = matchType;
    this.regex = regex;
    this.prefix = prefix;
    this.substring = substring;
    this.optimize();
  }

  public getMatchingTags(tags: string[]): string[] {
    switch (this.matchType) {
      case WildcardMatchType.PREFIX: return this.getMatchingTagsPrefix(tags);
      case WildcardMatchType.CONTAINS: return this.getMatchingTagsContains(tags);
      default: return this.getMatchingTagsRegex(tags);
    }
  }

  protected override matchesPositive(item: Searchable): boolean {
    switch (this.matchType) {
      case WildcardMatchType.PREFIX: return this.matchesStartsWith(item);
      case WildcardMatchType.CONTAINS: return this.matchesContains(item);
      default: return this.matchesRegex(item);
    }
  }

  protected override matchesNegated(item: Searchable): boolean {
    return !this.matchesPositive(item);
  }

  private optimize(): void {
    this.matchesPositive = this.matchType === WildcardMatchType.PREFIX ? this.matchesStartsWith : this.matchType === WildcardMatchType.CONTAINS ? this.matchesContains : this.matchesRegex;
    this.matches = this.negated ? this.matchesNegated : this.matchesPositive;
  }

  private findFirstPrefixMatchIndex(tags: string[]): number {
    let lo = 0;
    let hi = tags.length - 1;

    while (lo <= hi) {
      // eslint-disable-next-line no-bitwise
      const mid = (lo + hi) >>> 1;

      if (tags[mid] < this.prefix) {
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return lo;
  }

  private matchesStartsWith(item: Searchable): boolean {
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

  private matchesContains(item: Searchable): boolean {
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

  private getMatchingTagsContains(tags: string[]): string[] {
    return tags.filter(tag => tag.includes(this.substring));
  }

  private getMatchingTagsRegex(tags: string[]): string[] {
    return tags.filter(tag => this.regex.test(tag));
  }
}
