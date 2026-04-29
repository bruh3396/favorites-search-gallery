import { AbstractSearchTag } from "./abstract_search_tag";
import { Searchable } from "../../../types/search";

export class ExactSearchTag extends AbstractSearchTag {
  protected override readonly baseCost: number = 0;

  protected matchesPositive(item: Searchable): boolean {
    return item.tags.has(this.value);
  }

  protected matchesNegated(item: Searchable): boolean {
    return !item.tags.has(this.value);
  }
}
