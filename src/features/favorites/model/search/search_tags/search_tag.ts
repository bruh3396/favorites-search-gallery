import { Searchable } from "../../../../../types/common_types";

export class SearchTag {
  public value: string;
  public negated: boolean;

  constructor(searchTag: string) {
    this.negated = searchTag.startsWith("-") && searchTag.length > 1;
    this.value = this.negated ? searchTag.substring(1) : searchTag;
    this.matches = this.negated ? this.matchesNegated : this.matches;
  }

  public get finalCost(): number {
    return this.negated ? this.cost + 1 : this.cost;
  }

  protected get cost(): number {
    return 0;
  }

  public matches(item: Searchable): boolean {
    return item.tags.has(this.value);
  }

  public matchesNegated(item: Searchable): boolean {
    return !item.tags.has(this.value);
  }
}
