import { AbstractSearchTerm } from "./abstract_term";
import { Searchable } from "../../../types/search";

export class ExactSearchTerm extends AbstractSearchTerm {
  protected override readonly baseCost: number = 0;

  protected matchesPositive(item: Searchable): boolean {
    return item.tags.has(this.value);
  }

  protected matchesNegated(item: Searchable): boolean {
    return !item.tags.has(this.value);
  }
}
