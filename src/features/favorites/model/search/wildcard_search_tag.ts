import {SearchTag} from "./search_tag";
import {Searchable} from "../../types/favorite/interfaces";
import {escapeParenthesis} from "../../../../utils/primitive/string";

const UNMATCHABLE_REGEX = /^\b$/;
const STARTS_WITH_REGEX = /^[^*]*\*$/;
const CONTAINS_REGEX = /^\*[^*]*\*$/;

enum WildcardMatchType {
  STARTS_WITH = 10,
  CONTAINS = 15,
  DEFAULT = 20,
}

export class WildcardSearchTag extends SearchTag {
  private matchRegex: RegExp;
  private matchType: WildcardMatchType;
  private startsWithPrefix: string;
  private containsSubstring: string;

  get cost(): number {
    return this.matchType.valueOf();
  }

  constructor(searchTag: string) {
    super(searchTag);
    this.value = this.removeDuplicateAsterisks(this.value);
    this.matchRegex = this.createWildcardRegex();
    this.startsWithPrefix = this.value.slice(0, -1);
    this.containsSubstring = this.value.slice(1, -1);
    this.matchType = this.getMatchType();
    this.matches = this.getMatchFunction();
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
        [WildcardMatchType.STARTS_WITH]: this.startsWith,
        [WildcardMatchType.CONTAINS]: this.contains,
        [WildcardMatchType.DEFAULT]: this.matchesWildcard
      }[this.matchType] || this.matchesWildcard;
  }

  private startsWith(item: Searchable): boolean {
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

  private contains(item: Searchable): boolean {
    for (const tag of item.tags.values()) {
      if (tag.includes(this.containsSubstring)) {
        return !this.negated;
      }
    }
    return this.negated;
  }

  private matchesWildcard(item: Searchable): boolean {
    for (const tag of item.tags.values()) {
      if (this.matchRegex.test(tag)) {
        return !this.negated;
      }
    }
    return this.negated;
  }
}
