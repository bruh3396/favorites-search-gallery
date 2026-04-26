import { Searchable } from "../../../types/common_types";

export abstract class AbstractSearchTag {
  public readonly value: string;
  public readonly negated: boolean;
  public matches: (item: Searchable) => boolean;
  protected abstract readonly baseCost: number;

  constructor(value: string, negated: boolean) {
    this.value = value;
    this.negated = negated;
    this.matches = negated ? this.matchesNegated : this.matchesPositive;
  }

  public get cost(): number {
    return this.negated ? this.baseCost + 1 : this.baseCost;
  }

  protected abstract matchesPositive(item: Searchable): boolean;
  protected abstract matchesNegated(item: Searchable): boolean;
}
