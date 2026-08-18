import { Searchable } from "@/types/search";

export abstract class AbstractSearchTerm {
  public matches: (item: Searchable) => boolean;
  protected abstract readonly baseCost: number;

  constructor(public readonly value: string, public readonly isNegated: boolean) {
    this.matches = isNegated ? this.matchesNegated : this.matchesPositive;
  }

  public get cost(): number {
    return this.isNegated ? this.baseCost + 1 : this.baseCost;
  }

  protected abstract matchesPositive(item: Searchable): boolean;
  protected abstract matchesNegated(item: Searchable): boolean;
}
