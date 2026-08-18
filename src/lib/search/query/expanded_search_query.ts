import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { ExactSearchTerm } from "@/lib/search/terms/exact_search_term";
import { SearchQuery } from "@/lib/search/query/search_query";
import { Searchable } from "@/types/search";
import { WildcardSearchTerm } from "@/lib/search/terms/wildcard_search_term";

export class ExpandedSearchQuery<T extends Searchable> extends SearchQuery<T> {
  private unmatchable: boolean = false;
  private readonly indexedTerms: string[];

  constructor(searchQuery: string, indexedTerms: string[]) {
    super(searchQuery);
    this.indexedTerms = indexedTerms;
    this.expandAndWildcardTerms();
    this.expandAllOrGroupWildcardTerms();
  }

  public get isUnmatchable(): boolean {
    return this.unmatchable;
  }

  public override filter(items: T[]): T[] {
    return this.isUnmatchable ? [] : super.filter(items);
  }

  private expandAndWildcardTerms(): void {
    const newAndTerms: AbstractSearchTerm[] = [];

    for (const searchTerm of this.andTerms) {
      if (!(searchTerm instanceof WildcardSearchTerm)) {
        newAndTerms.push(searchTerm);
        continue;
      }
      const expandedTerms = this.expandWildcardTerm(searchTerm);

      if (searchTerm.isNegated) {
        newAndTerms.push(...expandedTerms);
        continue;
      }

      if (expandedTerms.length === 0) {
        this.markUnmatchable();
        return;
      }

      if (expandedTerms.length === 1) {
        newAndTerms.push(expandedTerms[0]);
        continue;
      }
      this.orGroups.push(expandedTerms);
    }
    this.andTerms = newAndTerms;
  }

  private expandAllOrGroupWildcardTerms(): void {
    const newOrGroups: AbstractSearchTerm[][] = [];

    for (const orGroup of this.orGroups) {
      const newOrGroup: AbstractSearchTerm[] = [];

      for (const searchTerm of orGroup) {
        if (!(searchTerm instanceof WildcardSearchTerm)) {
          newOrGroup.push(searchTerm);
          continue;
        }
        newOrGroup.push(...this.expandWildcardTerm(searchTerm));
      }

      if (newOrGroup.length === 1) {
        this.andTerms.push(newOrGroup[0]);
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
    this.andTerms = [];
    this.orGroups = [];
  }

  private expandWildcardTerm(wildcardTerm: WildcardSearchTerm): AbstractSearchTerm[] {
    return wildcardTerm.findMatchingTerms(this.indexedTerms)
    .map(term => new ExactSearchTerm(term, wildcardTerm.isNegated));
  }
}
