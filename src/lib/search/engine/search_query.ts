import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { Searchable } from "@/types/search";

export class SearchQuery<T extends Searchable> {
  constructor(public readonly andTerms: AbstractSearchTerm[] = [], public readonly orGroups: AbstractSearchTerm[][] = []) { }

  public allTerms(): AbstractSearchTerm[] {
    return [...this.andTerms, ...this.orGroups.flat()];
  }

  public filter(items: T[]): T[] {
    return items.filter(item => this.matchesAndTerms(item) && this.matchesOrGroups(item));
  }

  private matchesAndTerms(item: Searchable): boolean {
    return this.andTerms.every(term => term.matches(item));
  }

  private matchesOrGroups(item: Searchable): boolean {
    return this.orGroups.every(orGroup => orGroup.some(term => term.matches(item)));
  }
}
