import { buildSearchTerms, parseTermGroups, sortSearchTerms } from "@/lib/search/parsers/search_term_group_parser";
import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { ExactSearchTerm } from "@/lib/search/terms/exact_search_term";
import { MetadataSearchTerm } from "@/lib/search/terms/metadata_search_term";
import { Searchable } from "@/types/search";
import { isEmptyString } from "@/utils/pure/string";

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
    return new Set(this.andTerms.filter(searchTerm => searchTerm.isNegated).map(searchTerm => searchTerm.value));
  }

  public get requiredTerms(): string[] {
    return this.andTerms.filter(searchTerm => !searchTerm.isNegated).map(searchTerm => searchTerm.value);
  }

  public get hasOnlyExactTerms(): boolean {
    return this.allTerms.every(term => term instanceof ExactSearchTerm);
  }

  public get hasMetadataTerm(): boolean {
    return this.allTerms.some(term => term instanceof MetadataSearchTerm);
  }

  private get allTerms(): AbstractSearchTerm[] {
    return [...this.andTerms, ...this.orGroups.flat()];
  }

  public filter(items: T[]): T[] {
    return this.isEmpty ? items : items.filter(item => this.matchesAndTerms(item) && this.matchesOrGroups(item));
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
