import { buildSearchTerms, parseTermGroups, sortSearchTerms } from "@/lib/search/parsers/search_term_group_parser";
import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { Searchable } from "@/types/search";
import { isEmptyString } from "@/utils/string/query";

export class SearchQuery<T extends Searchable> {
  public readonly raw: string;
  public readonly isEmpty: boolean;
  public orGroups: AbstractSearchTerm[][] = [];
  public andTerms: AbstractSearchTerm[] = [];

  constructor(query: string) {
    this.raw = query;
    this.isEmpty = isEmptyString(query);

    if (this.isEmpty) {
      return;
    }
    const { orGroups, andTerms } = parseTermGroups(query);

    this.orGroups = orGroups.map(orGroup => buildSearchTerms(orGroup));
    this.andTerms = buildSearchTerms(andTerms);
    this.flattenSingletonOrGroups();
    this.orGroups.sort((a, b) => a.length - b.length);
  }

  public get negatedTerms(): Set<string> {
    return new Set(this.andTerms.filter(searchTerm => searchTerm.negated).map(searchTerm => searchTerm.value));
  }

  public get requiredTerms(): string[] {
    return this.andTerms.filter(searchTerm => !searchTerm.negated).map(searchTerm => searchTerm.value);
  }

  public get orGroupTerms(): string[][] {
    return this.orGroups.map(orGroup => orGroup.map(searchTerm => searchTerm.value));
  }

  public filter(items: T[]): T[] {
    return this.isEmpty ? items : items.filter(item => this.matchesAndTerms(item) && this.matchesOrGroups(item));
  }

  public equals(other: SearchQuery<T>): boolean {
    return this.raw === other.raw;
  }

  private flattenSingletonOrGroups(): void {
    const multiTermOrGroups: AbstractSearchTerm[][] = [];

    for (const orGroup of this.orGroups) {
      if (orGroup.length === 1) {
        this.andTerms.push(orGroup[0]);
      } else {
        multiTermOrGroups.push(orGroup);
      }
    }
    this.orGroups = multiTermOrGroups;
    this.andTerms = sortSearchTerms(this.andTerms);
  }

  private matchesAndTerms(item: Searchable): boolean {
    return this.andTerms.every(searchTerm => searchTerm.matches(item));
  }

  private matchesOrGroups(item: Searchable): boolean {
    return this.orGroups.every(orGroup => orGroup.some(searchTerm => searchTerm.matches(item)));
  }
}
