import { Searchable } from "@/core/search/searchable";

export interface ParsedTerm {
  value: string;
  isNegated: boolean;
}

export abstract class AbstractSearchTerm {
  public readonly value: string;
  public readonly isNegated: boolean;
  public matches: (item: Searchable) => boolean;
  protected abstract readonly baseCost: number;

  constructor({ value, isNegated }: ParsedTerm) {
    this.value = value;
    this.isNegated = isNegated;
    this.matches = isNegated ? this.matchesNegated : this.matchesPositive;
  }

  public get cost(): number {
    return this.isNegated ? this.baseCost + 1 : this.baseCost;
  }

  public get literal(): string {
    return this.isNegated ? `-${this.value}` : this.value;
  }

  protected abstract matchesPositive(item: Searchable): boolean;
  protected abstract matchesNegated(item: Searchable): boolean;
}
