import {Searchable} from "../../types/favorite/interfaces";

export class SearchTag {
  protected value: string;
  public negated: boolean;

  protected get cost():number {
    return 0;
  }

  get finalCost(): number {
    return this.negated ? this.cost + 1 : this.cost;
  }

  constructor(searchTag: string) {
    this.negated = searchTag.startsWith("-") && searchTag.length > 1;
    this.value = this.negated ? searchTag.substring(1) : searchTag;
  }

  public matches(item: Searchable): boolean {
    return item.tags.has(this.value) !== this.negated;
  }
}
