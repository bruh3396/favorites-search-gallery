import { SearchCommand } from "./search_command";
import { SearchTag } from "../search_tags/search_tag";
import { Searchable } from "../../../../../types/common_types";
import { WildcardSearchTag } from "../search_tags/wildcard_search_tag";

export class ExpandedSearchCommand<T extends Searchable> extends SearchCommand<T> {
  public hasNoMatches: boolean;
  private readonly indexedTags: string[];

  constructor(searchQuery: string, indexedTags: string[]) {
    super(searchQuery);
    this.indexedTags = indexedTags;
    this.hasNoMatches = false;
    this.expandRemainingWildcardTags();
    this.expandAllOrGroupWildcardTags();
  }

  private expandRemainingWildcardTags(): void {
    const newRemainingTags: SearchTag[] = [];

    for (const tagToExpand of this.remainingTags) {
      if (!(tagToExpand instanceof WildcardSearchTag)) {
        newRemainingTags.push(tagToExpand);
        continue;
      }
      const expandedTags = this.expandWildcardTag(tagToExpand);

      if (tagToExpand.negated) {
        for (const expandedNegatedTag of expandedTags) {
          this.remainingTags.push(expandedNegatedTag);
        }
        continue;
      }

      if (expandedTags.length === 0) {
        this.setAsUnmatchable();
        return;
      }

      if (expandedTags.length === 1) {
        newRemainingTags.push(expandedTags[0]);
        continue;
      }
      this.orGroups.push(expandedTags);
    }
    this.remainingTags = newRemainingTags;
  }

  private expandAllOrGroupWildcardTags(): void {
    const newOrGroups: SearchTag[][] = [];

    for (const orGroup of this.orGroups) {
      const newOrGroup: SearchTag[] = [];

      for (const tag of orGroup) {
        if (!(tag instanceof WildcardSearchTag)) {
          newOrGroup.push(tag);
          continue;
        }

        for (const expandedTag of this.expandWildcardTag(tag)) {
          newOrGroup.push(expandedTag);
        }
      }

      if (newOrGroup.length === 1) {
        this.remainingTags.push(newOrGroup[0]);
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
    this.remainingTags = [];
    this.orGroups = [];
  }

  private expandWildcardTag(wildcardTag: WildcardSearchTag): SearchTag[] {
    return wildcardTag.getMatchingTags(this.indexedTags)
      .map(matchingTag => new SearchTag(wildcardTag.negated ? `-${matchingTag}` : matchingTag));
  }
}
