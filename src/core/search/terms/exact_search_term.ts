import { AbstractSearchTerm } from "@/core/search/terms/abstract_search_term";
import { Searchable } from "@/core/search/searchable";

export class ExactSearchTerm extends AbstractSearchTerm {
  protected override readonly baseCost: number = 0;

  protected matchesPositive(item: Searchable): boolean {
    return item.tags.has(this.value);
  }

  protected matchesNegated(item: Searchable): boolean {
    return !item.tags.has(this.value);
  }
}
