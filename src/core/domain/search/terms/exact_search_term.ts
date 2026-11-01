import { SearchTerm } from "@/core/domain/search/terms/search_term";
import { Searchable } from "@/core/domain/search/searchable";

export class ExactSearchTerm extends SearchTerm {
  protected override readonly baseCost: number = 0;

  protected matchesPositive(searchable: Searchable): boolean {
    return searchable.tags.has(this.value);
  }

  protected matchesNegated(searchable: Searchable): boolean {
    return !searchable.tags.has(this.value);
  }
}
