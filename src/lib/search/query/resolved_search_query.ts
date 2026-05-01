import { AbstractSearchTag } from "../tag/abstract_search_tag";
import { ExactSearchTag } from "../tag/exact_search_tag";
import { SearchQuery } from "./search_query";
import { Searchable } from "../../../types/search";
import { WildcardSearchTag } from "../tag/wildcard_search_tag";

export class ResolvedSearchQuery<T extends Searchable> extends SearchQuery<T> {
  private unmatchable: boolean = false;
  private readonly indexedTags: string[];

  constructor(searchQuery: string, indexedTags: string[]) {
    super(searchQuery);
    this.indexedTags = indexedTags;
    this.resolveAndWildcardTags();
    this.resolveAllOrGroupWildcardTags();
  }

  public get isUnmatchable(): boolean {
    return this.unmatchable;
  }

  public override apply(items: T[]): T[] {
    return this.isUnmatchable ? [] : super.apply(items);
  }

  private resolveAndWildcardTags(): void {
    const andTags: AbstractSearchTag[] = [];

    for (const tagToResolve of this.andTags) {
      if (!(tagToResolve instanceof WildcardSearchTag)) {
        andTags.push(tagToResolve);
        continue;
      }
      const resolvedTags = this.resolveWildcardTag(tagToResolve);

      if (tagToResolve.negated) {
        andTags.push(...resolvedTags);
        continue;
      }

      if (resolvedTags.length === 0) {
        this.markUnmatchable();
        return;
      }

      if (resolvedTags.length === 1) {
        andTags.push(resolvedTags[0]);
        continue;
      }
      this.orGroups.push(resolvedTags);
    }
    this.andTags = andTags;
  }

  private resolveAllOrGroupWildcardTags(): void {
    const newOrGroups: AbstractSearchTag[][] = [];

    for (const orGroup of this.orGroups) {
      const newOrGroup: AbstractSearchTag[] = [];

      for (const tag of orGroup) {
        if (!(tag instanceof WildcardSearchTag)) {
          newOrGroup.push(tag);
          continue;
        }
        newOrGroup.push(...this.resolveWildcardTag(tag));
      }

      if (newOrGroup.length === 1) {
        this.andTags.push(newOrGroup[0]);
        continue;
      }

      if (newOrGroup.length === 0) {
        this.markUnmatchable();
        return;
      }
      newOrGroups.push(newOrGroup);
    }
    this.orGroups = newOrGroups;
  }

  private markUnmatchable(): void {
    this.unmatchable = true;
    this.andTags = [];
    this.orGroups = [];
  }

  private resolveWildcardTag(wildcardTag: WildcardSearchTag): AbstractSearchTag[] {
    return wildcardTag.getMatchingTags(this.indexedTags).map(matchingTag => new ExactSearchTag(matchingTag, wildcardTag.negated));
  }
}
