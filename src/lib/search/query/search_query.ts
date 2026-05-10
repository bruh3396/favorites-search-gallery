import { buildTagGroup, categorizeTags, parseTagGroups, sortTagGroup } from "../parse/tag_group_parser";
import { AbstractTag } from "../tags/abstract_tag";
import { SearchQueryMetadata } from "../types/search_types";
import { Searchable } from "../../../types/search";
import { isEmptyString } from "../../../utils/string/query";

export class SearchQuery<T extends Searchable> {
  public readonly rawQuery: string;
  public readonly isEmpty: boolean;
  public orGroups: AbstractTag[][] = [];
  public andTags: AbstractTag[] = [];

  constructor(searchQuery: string) {
    this.rawQuery = searchQuery;
    this.isEmpty = isEmptyString(searchQuery);

    if (this.isEmpty) {
      return;
    }
    const { orGroups, andTags } = parseTagGroups(searchQuery);

    this.orGroups = orGroups.map(orGroup => buildTagGroup(orGroup));
    this.andTags = buildTagGroup(andTags);
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

  public apply(items: T[]): T[] {
    return this.isEmpty ? items : items.filter(item => this.matchesAndTags(item) && this.matchesOrGroups(item));
  }

  public equals(other: SearchQuery<T>): boolean {
    return this.rawQuery === other.rawQuery;
  }

  private flattenSingleTagOrGroups(): void {
    const multiTagOrGroups: AbstractTag[][] = [];

    for (const orGroup of this.orGroups) {
      if (orGroup.length === 1) {
        this.andTags.push(orGroup[0]);
      } else {
        multiTagOrGroups.push(orGroup);
      }
    }
    this.orGroups = multiTagOrGroups;
    this.andTags = sortTagGroup(this.andTags);
  }

  private matchesAndTags(item: Searchable): boolean {
    return this.andTags.every(tag => tag.matches(item));
  }

  private matchesOrGroups(item: Searchable): boolean {
    return this.orGroups.every(orGroup => orGroup.some(tag => tag.matches(item)));
  }
}
