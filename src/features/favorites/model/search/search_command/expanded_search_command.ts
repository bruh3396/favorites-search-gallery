import { SearchCommand } from "./search_command";
import { SearchTag } from "../search_tags/search_tag";
import { Searchable } from "../../../../../types/interfaces/interfaces";
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

  private expandRemainingWildcardTags():void {
    const newRemainingTags: SearchTag[] = [];

    for (const tag of this.remainingTags) {
      if (!(tag instanceof WildcardSearchTag)) {
          newRemainingTags.push(tag);
        continue;
      }
      const expandedWildcardTags = this.expandWildcardTag(tag);

      if (tag.negated) {
        for (const expandedNegatedTag of expandedWildcardTags) {
          this.remainingTags.push(expandedNegatedTag);
        }
        continue;
      }

      if (expandedWildcardTags.length > 1) {
        this.orGroups.push(expandedWildcardTags);
        continue;
      }

      if (expandedWildcardTags.length === 1) {
        newRemainingTags.push(expandedWildcardTags[0]);
        continue;
      }
      this.setAsUnmatchable();
      return;
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
    const result: SearchTag[] = [];

    for (const matchingIndexedTag of wildcardTag.getMatchingTags(this.indexedTags)) {
      const indexedTagWithNegation = wildcardTag.negated ? `-${matchingIndexedTag}` : matchingIndexedTag;

      result.push(new SearchTag(indexedTagWithNegation));
    }
    return result;
  }
}
