import { extractTagGroups, isEmptyString } from "../../../../../utils/primitive/string";
import { FavoriteMetadataSearchExpression } from "../../../types/metadata/favorite_metadata_search_expression";
import { MetadataSearchTag } from "../search_tags/metadata_search_tag";
import { SearchCommandMetadata } from "../../../types/metadata/search_command_metadata";
import { SearchTag } from "../search_tags/search_tag";
import { Searchable } from "../../../../../types/interfaces/interfaces";
import { WildcardSearchTag } from "../search_tags/wildcard_search_tag";

export function isWildcardSearchTag(tag: string): boolean {
  return tag.includes("*");
}

export function isMetadataSearchTag(tag: string): boolean {
  return FavoriteMetadataSearchExpression.regex.test(tag);
}

export function createSearchTag(tag: string): SearchTag {
  if (isWildcardSearchTag(tag)) {
    return new WildcardSearchTag(tag);
  }

  if (isMetadataSearchTag(tag)) {
    return new MetadataSearchTag(tag);
  }
  return new SearchTag(tag);
}

export function createSearchTagGroup(tags: string[]): SearchTag[] {
  const searchTags = Array.from(new Set(tags)).map(tag => createSearchTag(tag));
  return sortSearchTagGroup(searchTags);
}

export function sortSearchTagGroup(searchTags: SearchTag[]): SearchTag[] {
  return searchTags.sort((a, b) => {
    return a.finalCost - b.finalCost;
  });
}

export class SearchCommand<T extends Searchable> {
  public orGroups: SearchTag[][] = [];
  public remainingTags: SearchTag[] = [];
  public readonly isEmpty: boolean;
  public details: SearchCommandMetadata;
  public query;

  constructor(searchQuery: string) {
    this.query = searchQuery;
    this.isEmpty = isEmptyString(searchQuery);
    this.details = this.getSearchCommandMetadata();

    if (this.isEmpty) {
      return;
    }
    const { orGroups, remainingTags } = extractTagGroups(searchQuery);

    this.orGroups = orGroups.map(orGroup => createSearchTagGroup(orGroup));
    this.remainingTags = createSearchTagGroup(remainingTags);
    this.simplifyOrGroupsWithOnlyOneTag();
    this.sortOrGroupsByLength();
    this.details = this.getSearchCommandMetadata();
  }

  public get negatedTags(): Set<string> {
    return new Set(this.remainingTags.filter(tag => tag.negated).map(tag => tag.value));
  }

  public get nonNegatedTags(): string[] {
    return this.remainingTags.filter(tag => !tag.negated).map(tag => tag.value);
  }

  public get tagGroups(): { orGroups: SearchTag[][]; remainingTags: SearchTag[] } {
    return {
      orGroups: this.orGroups,
      remainingTags: this.remainingTags
    };
  }

  public getSearchResults(items: T[]): T[] {
    return this.isEmpty ? items : items.filter(item => this.matches(item));
  }

  private getSearchCommandMetadata(): SearchCommandMetadata {
    const normalTags: SearchTag[] = [];
    const wildcardTags: WildcardSearchTag[] = [];
    const metadataTags: MetadataSearchTag[] = [];

    for (const tag of this.remainingTags) {
      if (tag instanceof WildcardSearchTag) {
        wildcardTags.push(tag);
      } else if (tag instanceof MetadataSearchTag) {
        metadataTags.push(tag);
      } else if (!tag.negated) {
        normalTags.push(tag);
      }
    }

    for (const orGroup of this.orGroups) {
      for (const tag of orGroup) {
        if (tag instanceof WildcardSearchTag) {
          wildcardTags.push(tag);
        } else if (tag instanceof MetadataSearchTag) {
          metadataTags.push(tag);
        }
      }
    }
    return {
      normalTags,
      wildcardTags,
      metadataTags,
      hasNormalTag: normalTags.length > 0,
      hasWildcardTag: wildcardTags.length > 0,
      hasMetadataTag: metadataTags.length > 0,
      hasOrGroup: this.orGroups.length > 0
    };
  }

  private matches(item: Searchable): boolean {
    return this.matchesAllRemainingTags(item) && this.matchesAllOrGroups(item);
  }

  private matchesAllRemainingTags(item: Searchable): boolean {
    return this.remainingTags.every(tag => tag.matches(item));
  }

  private matchesAllOrGroups(item: Searchable): boolean {
    return this.orGroups.every(orGroup => orGroup.some(tag => tag.matches(item)));
  }

  private simplifyOrGroupsWithOnlyOneTag(): void {
    this.orGroups = this.orGroups.filter(orGroup => {
      if (orGroup.length === 1) {
        this.remainingTags.push(orGroup[0]);
        return false;
      }
      return true;
    });
    sortSearchTagGroup(this.remainingTags);
  }

  private sortOrGroupsByLength(): void {
    this.orGroups.sort((a, b) => {
      return a.length - b.length;
    });
  }
}
