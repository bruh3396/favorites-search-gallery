import { SearchTerm } from "@/core/domain/search/terms/search_term";
import { Searchable } from "@/core/domain/search/searchable";

export class ExactSearchTerm extends SearchTerm {
  protected override readonly baseCost: number = 0;

  protected matchesPositive(item: Searchable): boolean {
    return item.tags.has(this.value);
  }

  protected matchesNegated(item: Searchable): boolean {
    return !item.tags.has(this.value);
  }
}
