import { buildSearchTagGroup, categorizeTags, sortSearchTagGroup } from "./search_query_utils";
import { AbstractSearchTag } from "../tag/abstract_search_tag";
import { SearchQueryMetadata } from "../types/search_types";
import { Searchable } from "../../../types/search";
import { isEmptyString } from "../../../utils/string/query";
import { parseTagGroups } from "../../../utils/string/parse";

export class SearchQuery<T extends Searchable> {
  public readonly rawQuery;
  public readonly isEmpty: boolean;
  public orGroups: AbstractSearchTag[][] = [];
  public andTags: AbstractSearchTag[] = [];

  constructor(searchQuery: string) {
    this.rawQuery = searchQuery;
    this.isEmpty = isEmptyString(searchQuery);

    if (this.isEmpty) {
      return;
    }
    const { orGroups, andTags } = parseTagGroups(searchQuery);

    this.orGroups = orGroups.map(orGroup => buildSearchTagGroup(orGroup));
    this.andTags = buildSearchTagGroup(andTags);
    this.flattenSingleTagOrGroups();
    this.orGroups.sort((a, b) => a.length - b.length);
  }

  public get metadata(): SearchQueryMetadata {
    const andTags = categorizeTags(this.andTags);
    const orTags = categorizeTags(this.orGroups.flat());
    return {
      hasPositiveAndTag: andTags.positiveTags.length > 0,
      hasWildcardTag: andTags.wildcardTags.length + orTags.wildcardTags.length > 0,
      hasMetadataTag: andTags.metadataTags.length + orTags.metadataTags.length > 0,
      hasOrGroup: this.orGroups.length > 0
    };
  }

  public get negatedTags(): Set<string> {
    return new Set(this.andTags.filter(tag => tag.negated).map(tag => tag.value));
  }

  public get positiveAndTags(): string[] {
    return this.andTags.filter(tag => !tag.negated).map(tag => tag.value);
  }

  public filter(items: T[]): T[] {
    return this.isEmpty ? items : items.filter(item => this.matchesAndTags(item) && this.matchesOrGroups(item));
  }

  private flattenSingleTagOrGroups(): void {
    const multiTagOrGroups: AbstractSearchTag[][] = [];

    for (const orGroup of this.orGroups) {
      if (orGroup.length === 1) {
        this.andTags.push(orGroup[0]);
      } else {
        multiTagOrGroups.push(orGroup);
      }
    }
    this.orGroups = multiTagOrGroups;
    this.andTags = sortSearchTagGroup(this.andTags);
  }

  private matchesAndTags(item: Searchable): boolean {
    return this.andTags.every(tag => tag.matches(item));
  }

  private matchesOrGroups(item: Searchable): boolean {
    return this.orGroups.every(orGroup => orGroup.some(tag => tag.matches(item)));
  }
}
