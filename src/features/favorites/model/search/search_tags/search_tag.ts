import {Searchable} from "../../../types/favorite/favorite_interfaces";

export class SearchTag {
  public value: string;
  public negated: boolean;

  protected get cost(): number {
    return 0;
  }

  get finalCost(): number {
    return this.negated ? this.cost + 1 : this.cost;
  }

  constructor(searchTag: string) {
    this.negated = searchTag.startsWith("-") && searchTag.length > 1;
    this.value = this.negated ? searchTag.substring(1) : searchTag;
    this.matches = this.negated ? this.matchesNegated : this.matches;
  }

  public matches(item: Searchable): boolean {
    return item.tags.has(this.value);
  }

  public matchesNegated(item: Searchable): boolean {
    return !item.tags.has(this.value);
  }
}
