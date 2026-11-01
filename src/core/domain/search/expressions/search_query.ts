import { SearchTerm } from "@/core/domain/search/terms/search_term";
import { Searchable } from "@/core/domain/search/searchable";

export class SearchQuery<Doc> {
  constructor(
    public readonly searchTerms: SearchTerm[] = [],
    public readonly orGroups: SearchTerm[][] = []
  ) { }

  public filter(items: (Doc & Searchable)[]): Doc[] {
    return items.filter(item => this.matchesAndTerms(item) && this.matchesOrGroups(item));
  }

  private matchesAndTerms(searchable: Searchable): boolean {
    return this.searchTerms.every(searchTerm => searchTerm.matches(searchable));
  }

  private matchesOrGroups(searchable: Searchable): boolean {
    return this.orGroups.every(searchTerms => searchTerms.some(searchTerm => searchTerm.matches(searchable)));
  }
}
