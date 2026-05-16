import { AbstractSearchTerm } from "../terms/abstract_term";
import { ExactSearchTerm } from "../terms/exact_term";
import { SearchQuery } from "./search_query";
import { Searchable } from "../../../types/search";
import { WildcardSearchTerm } from "../terms/wildcard_term";

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
    const andTags: AbstractSearchTerm[] = [];

    for (const tagToResolve of this.andTags) {
      if (!(tagToResolve instanceof WildcardSearchTerm)) {
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
    const newOrGroups: AbstractSearchTerm[][] = [];

    for (const orGroup of this.orGroups) {
      const newOrGroup: AbstractSearchTerm[] = [];

      for (const tag of orGroup) {
        if (!(tag instanceof WildcardSearchTerm)) {
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

  private resolveWildcardTag(wildcardTag: WildcardSearchTerm): AbstractSearchTerm[] {
    return wildcardTag.getMatchingTags(this.indexedTags).map(matchingTag => new ExactSearchTerm(matchingTag, wildcardTag.negated));
  }
}
