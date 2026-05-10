import { AbstractTag } from "./abstract_tag";
import { Searchable } from "../../../types/search";

export class ExactTag extends AbstractTag {
  protected override readonly baseCost: number = 0;

  protected matchesPositive(item: Searchable): boolean {
    return item.tags.has(this.value);
  }

  protected matchesNegated(item: Searchable): boolean {
    return !item.tags.has(this.value);
  }
}
