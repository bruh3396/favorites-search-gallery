import { SearchTerm } from "@/core/domain/search/terms/search_term";
import { Searchable } from "@/core/domain/search/searchable";

export class SearchQuery<Doc> {
  constructor(
    public readonly andTerms: SearchTerm[] = [],
    public readonly orGroups: SearchTerm[][] = []
  ) { }

  public filter(items: (Doc & Searchable)[]): Doc[] {
    return items.filter(item => this.matchesAndTerms(item) && this.matchesOrGroups(item));
  }

  private matchesAndTerms(item: Searchable): boolean {
    return this.andTerms.every(term => term.matches(item));
  }

  private matchesOrGroups(item: Searchable): boolean {
    return this.orGroups.every(orGroup => orGroup.some(term => term.matches(item)));
  }
}
