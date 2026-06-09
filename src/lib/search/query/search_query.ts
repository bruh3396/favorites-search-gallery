import { buildSearchTerms, categorizeSearchTerms, parseTermGroups, sortSearchTerms } from "@/lib/search/parsers/search_term_group_parser";
import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { SearchQueryMetadata } from "@/lib/search/types/search_types";
import { Searchable } from "@/types/search";
import { isEmptyString } from "@/utils/string/query";

export class SearchQuery<T extends Searchable> {
  public readonly raw: string;
  public readonly isEmpty: boolean;
  public orGroups: AbstractSearchTerm[][] = [];
  public andTerms: AbstractSearchTerm[] = [];

  constructor(searchQuery: string) {
    this.raw = searchQuery;
    this.isEmpty = isEmptyString(searchQuery);

    if (this.isEmpty) {
      return;
    }
    const { orGroups, andTerms } = parseTermGroups(searchQuery);

    this.orGroups = orGroups.map(orGroup => buildSearchTerms(orGroup));
    this.andTerms = buildSearchTerms(andTerms);
    this.flattenSingletonOrGroups();
    this.orGroups.sort((a, b) => a.length - b.length);
  }

  public get metadata(): SearchQueryMetadata {
    const andTerms = categorizeSearchTerms(this.andTerms);
    const orTerms = categorizeSearchTerms(this.orGroups.flat());
    return {
      hasRequiredTerm: andTerms.required.length > 0,
      hasWildcardTerm: andTerms.wildcard.length + orTerms.wildcard.length > 0,
      hasMetadataTerm: andTerms.metadata.length + orTerms.metadata.length > 0,
      hasOrGroup: this.orGroups.length > 0
    };
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
