import { AbstractTag } from "../tags/abstract_tag";
import { ExactTag } from "../tags/exact_tag";
import { SearchQuery } from "./search_query";
import { Searchable } from "../../../types/search";
import { WildcardTag } from "../tags/wildcard_tag";

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
    const andTags: AbstractTag[] = [];

    for (const tagToResolve of this.andTags) {
      if (!(tagToResolve instanceof WildcardTag)) {
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
    const newOrGroups: AbstractTag[][] = [];

    for (const orGroup of this.orGroups) {
      const newOrGroup: AbstractTag[] = [];

      for (const tag of orGroup) {
        if (!(tag instanceof WildcardTag)) {
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

  private resolveWildcardTag(wildcardTag: WildcardTag): AbstractTag[] {
    return wildcardTag.getMatchingTags(this.indexedTags).map(matchingTag => new ExactTag(matchingTag, wildcardTag.negated));
  }
}
