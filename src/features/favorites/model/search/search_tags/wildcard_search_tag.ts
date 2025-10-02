import { SearchTag } from "./search_tag";
import { Searchable } from "../../../../../types/common_types";
import { escapeParenthesis } from "../../../../../utils/primitive/string";

const UNMATCHABLE_REGEX = /^\b$/;
const STARTS_WITH_REGEX = /^[^*]*\*$/;
const CONTAINS_REGEX = /^\*[^*]*\*$/;

enum WildcardMatchType {
  STARTS_WITH = 10,
  CONTAINS = 15,
  DEFAULT = 20,
}

export class WildcardSearchTag extends SearchTag {
  public getMatchingTags: (tags: string[]) => string[];
  private matchRegex: RegExp;
  private matchType: WildcardMatchType;
  private startsWithPrefix: string;
  private containsSubstring: string;

  constructor(searchTag: string) {
    super(searchTag);
    this.value = this.removeDuplicateAsterisks(this.value);
    this.matchRegex = this.createWildcardRegex();
    this.startsWithPrefix = this.value.slice(0, -1);
    this.containsSubstring = this.value.slice(1, -1);
    this.matchType = this.getMatchType();
    this.matches = this.getMatchFunction();
    this.getMatchingTags = this.getMatchingTagsFunction();
  }

  protected get cost(): number {
    return this.matchType.valueOf();
  }

  public matchesSingleTag(tag: string): boolean {
    return this.matchRegex.test(tag);
  }

  private getMatchingTagsFunction(): (tags: string[]) => string[] {
    return {
      [WildcardMatchType.STARTS_WITH]: this.getMatchingTagsStartsWith,
      [WildcardMatchType.CONTAINS]: this.getMatchingTagsContains,
      [WildcardMatchType.DEFAULT]: this.getMatchingTagsRegex
    }[this.matchType] ?? this.getMatchingTagsRegex;
  }

  private getMatchType(): WildcardMatchType {
    if (STARTS_WITH_REGEX.test(this.value)) {
      return WildcardMatchType.STARTS_WITH;
    }

    if (CONTAINS_REGEX.test(this.value)) {
      return WildcardMatchType.CONTAINS;
    }
    return WildcardMatchType.DEFAULT;
  }

  private getMatchFunction(): (item: Searchable) => boolean {
    return {
      [WildcardMatchType.STARTS_WITH]: this.matchesStartsWith,
      [WildcardMatchType.CONTAINS]: this.matchesContains,
      [WildcardMatchType.DEFAULT]: this.matchesRegex
    }[this.matchType] ?? this.matchesRegex;
  }

  private getMatchingTagsStartsWith(tags: string[]): string[] {
    const matchingTags: string[] = [];

    for (const tag of tags) {
      if (tag.startsWith(this.startsWithPrefix)) {
        matchingTags.push(tag);
        continue;
      }

      if (matchingTags.length > 0) {
        break;
      }
    }
    return matchingTags;
  }

  private getMatchingTagsContains(tags: string[]): string[] {
    return tags.filter(tag => tag.includes(this.containsSubstring));
  }

  private getMatchingTagsRegex(tags: string[]): string[] {
    return tags.filter(tag => this.matchRegex.test(tag));
  }

  private matchesStartsWith(item: Searchable): boolean {
    for (const tag of item.tags.values()) {
      if (tag.startsWith(this.startsWithPrefix)) {
        return !this.negated;
      }

      if (this.startsWithPrefix < tag) {
        break;
      }
    }
    return this.negated;
  }

  private matchesContains(item: Searchable): boolean {
    for (const tag of item.tags.values()) {
      if (tag.includes(this.containsSubstring)) {
        return !this.negated;
      }
    }
    return this.negated;
  }

  private matchesRegex(item: Searchable): boolean {
    for (const tag of item.tags.values()) {
      if (this.matchRegex.test(tag)) {
        return !this.negated;
      }
    }
    return this.negated;
  }

  private removeDuplicateAsterisks(value: string): string {
    return value.replace(/\*+/g, "*");
  }

  private createWildcardRegex(): RegExp {
    try {
      const regex = escapeParenthesis(this.value.replace(/\*/g, ".*"));
      return new RegExp(`^${regex}$`);
    } catch {
      return UNMATCHABLE_REGEX;
    }
  }
}
