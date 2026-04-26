import { AbstractSearchTag } from "../tag/abstract_search_tag";
import { ExactSearchTag } from "../tag/exact_search_tag";
import { SearchQuery } from "./search_query";
import { Searchable } from "../../../types/common_types";
import { WildcardSearchTag } from "../tag/wildcard_search_tag";

export class ExpandedSearchQuery<T extends Searchable> extends SearchQuery<T> {
  public hasNoMatches: boolean = false;
  private readonly indexedTags: string[];

  constructor(searchQuery: string, indexedTags: string[]) {
    super(searchQuery);
    this.indexedTags = indexedTags;
    this.expandAndWildcardTags();
    this.expandAllOrGroupWildcardTags();
  }

  public override filter(items: T[]): T[] {
    return this.hasNoMatches ? [] : super.filter(items);
  }

  private expandAndWildcardTags(): void {
    const andTags: AbstractSearchTag[] = [];

    for (const tagToExpand of this.andTags) {
      if (!(tagToExpand instanceof WildcardSearchTag)) {
        andTags.push(tagToExpand);
        continue;
      }
      const expandedTags = this.expandWildcardTag(tagToExpand);

      if (tagToExpand.negated) {
        andTags.push(...expandedTags);
        continue;
      }

      if (expandedTags.length === 0) {
        this.setAsUnmatchable();
        return;
      }

      if (expandedTags.length === 1) {
        andTags.push(expandedTags[0]);
        continue;
      }
      this.orGroups.push(expandedTags);
    }
    this.andTags = andTags;
  }

  private expandAllOrGroupWildcardTags(): void {
    const newOrGroups: AbstractSearchTag[][] = [];

    for (const orGroup of this.orGroups) {
      const newOrGroup: AbstractSearchTag[] = [];

      for (const tag of orGroup) {
        if (!(tag instanceof WildcardSearchTag)) {
          newOrGroup.push(tag);
          continue;
        }
        newOrGroup.push(...this.expandWildcardTag(tag));
      }

      if (newOrGroup.length === 1) {
        this.andTags.push(newOrGroup[0]);
        continue;
      }

      if (newOrGroup.length === 0) {
        this.setAsUnmatchable();
        return;
      }
      newOrGroups.push(newOrGroup);
    }
    this.orGroups = newOrGroups;
  }

  private setAsUnmatchable(): void {
    this.hasNoMatches = true;
    this.andTags = [];
    this.orGroups = [];
  }

  private expandWildcardTag(wildcardTag: WildcardSearchTag): AbstractSearchTag[] {
    return wildcardTag.getMatchingTags(this.indexedTags).map(matchingTag => new ExactSearchTag(matchingTag, wildcardTag.negated));
  }
}
