import {createSearchTagGroup, sortSearchTagGroup} from "./search_command_utils";
import {extractTagGroups, isEmptyString} from "../../../../../utils/primitive/string";
import {SearchTag} from "../search_tags/search_tag";
import {Searchable} from "../../../types/favorite/favorite_interfaces";
import {WildcardSearchTag} from "../search_tags/wildcard_search_tag";

type SearchCommandMetadata = {
  wildcardTags: WildcardSearchTag[];
  normalTags: SearchTag[];
  hasWildcardTag: boolean;
  hasNormalTag: boolean;
  hasOrGroup: boolean;
}

export class SearchCommand<T extends Searchable> {
  public orGroups: SearchTag[][] = [];
  public remainingTags: SearchTag[] = [];
  public readonly isEmpty: boolean;
  public readonly query;

  get negatedTags(): Set<string> {
    return new Set(this.remainingTags.filter(tag => tag.negated).map(tag => tag.value));
  }

  get nonNegatedTags(): string[] {
    return this.remainingTags.filter(tag => !tag.negated).map(tag => tag.value);
  }

  get metadata(): SearchCommandMetadata {
    const normalTags: SearchTag[] = [];
    const wildcardTags: WildcardSearchTag[] = [];

    for (const tag of this.remainingTags) {
      if (tag instanceof WildcardSearchTag) {
        wildcardTags.push(tag);
      } else if (!tag.negated) {
        normalTags.push(tag);
      }
    }
    return {
      wildcardTags,
      normalTags,
      hasWildcardTag: wildcardTags.length > 0,
      hasNormalTag: normalTags.length > 0,
      hasOrGroup: this.orGroups.length > 0
    };
  }

  // get tagGroups(): { orGroups: SearchTag[][]; remainingTags: SearchTag[] } {
  //   return {
  //     orGroups: this.orGroups,
  //     remainingTags: this.remainingTags
  //   };
  // }

  constructor(searchQuery: string) {
    this.query = searchQuery;
    this.isEmpty = isEmptyString(searchQuery);

    if (this.isEmpty) {
      return;
    }
    const {orGroups, remainingTags} = extractTagGroups(searchQuery);

    this.orGroups = orGroups.map(orGroup => createSearchTagGroup(orGroup));
    this.remainingTags = createSearchTagGroup(remainingTags);
    this.simplifyOrGroupsWithOnlyOneTag();
    this.sortOrGroupsByLength();
  }

  public getSearchResults(items: T[]): T[] {
    return this.isEmpty ? items : items.filter(item => this.matches(item));
  }

  private matches(item: Searchable): boolean {
    return this.matchesAllRemainingTags(item) && this.matchesAllOrGroups(item);
  }

  private matchesAllRemainingTags(item: Searchable): boolean {
    return this.remainingTags.every(tag => tag.matches(item));
  }

  private matchesAllOrGroups(item: Searchable): boolean {
    return this.orGroups.every(orGroup => orGroup.some(tag => tag.matches(item)));
  }

  private simplifyOrGroupsWithOnlyOneTag(): void {
    this.orGroups = this.orGroups.filter(orGroup => {
      if (orGroup.length === 1) {
        this.remainingTags.push(orGroup[0]);
        return false;
      }
      return true;
    });
    sortSearchTagGroup(this.remainingTags);
  }

  private sortOrGroupsByLength(): void {
    this.orGroups.sort((a, b) => {
      return a.length - b.length;
    });
  }
}
