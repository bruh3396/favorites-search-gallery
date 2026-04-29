import { AbstractSearchTag } from "../tag/abstract_search_tag";
import { ExpandedSearchQuery } from "../query/expanded_search_query";
import { SearchQuery } from "../query/search_query";
import { Searchable } from "../../../types/search";
import { SortedArray } from "../../core/data_structures/sorted_array";
import { intersection } from "../../../utils/collection/set";

export class InvertedSearchIndex<T extends Searchable> {
  protected readonly sortedTags: SortedArray<string> = new SortedArray<string>();
  private readonly items: Set<T> = new Set<T>();
  private readonly index: Map<string, Set<T>> = new Map<string, Set<T>>();
  private maintainingSortOrder: boolean = false;

  public getAllTags(): string[] {
    return this.sortedTags.toArray();
  }

  public add(item: T): void {
    this.items.add(item);

    for (const tag of item.tags) {
      let items = this.index.get(tag);

      if (items === undefined) {
        items = new Set<T>();
        this.index.set(tag, items);
        this.addTag(tag);
      }
      items.add(item);
    }
  }

  public unlinkTags(item: T): void {
    for (const tag of item.tags) {
      const items = this.index.get(tag);

      if (items !== undefined) {
        items.delete(item);
      }
    }
  }

  public search(searchQuery: SearchQuery<T>, candidates: T[]): T[] {
    const expandedQuery = new ExpandedSearchQuery<T>(searchQuery.rawQuery, this.getAllTags());
    return expandedQuery.isEmpty ? candidates : expandedQuery.isUnmatchable ? [] : this.computeMatches(expandedQuery, candidates);
  }

  public keepTagsSorted(value: boolean): void {
    this.maintainingSortOrder = value;
  }

  private addTag(tag: string): void {
    if (this.maintainingSortOrder) {
      this.sortedTags.insert(tag);
    } else {
      this.sortedTags.push(tag);
    }
  }

  private computeMatches(expandedQuery: ExpandedSearchQuery<T>, candidates: T[]): T[] {
    const exclusions = this.unionItemsForTags(expandedQuery.negatedTags);
    const matches = this.intersectOrGroups(this.intersectAndTags(expandedQuery.positiveAndTags), expandedQuery.orGroups);
    return matches.size === 0 ? [] : candidates.filter(c => matches.has(c) && !exclusions.has(c));
  }

  private unionItemsForTags(tags: Iterable<string>): Set<T> {
    const result = new Set<T>();

    for (const tag of tags) {
      this.index.get(tag)?.forEach(item => result.add(item));
    }
    return result;
  }

  private intersectAndTags(requiredTags: string[]): Set<T> {
    const tagSets = requiredTags.map(tag => this.index.get(tag));
    const anyTagIsMissing = tagSets.some(set => set === undefined);

    if (anyTagIsMissing) {
      return new Set<T>();
    }
    let result = this.items;

    for (const tagSet of (tagSets as Set<T>[]).sort((a, b) => a.size - b.size)) {
      result = intersection(tagSet, result);

      if (result.size === 0) {
        return new Set<T>();
      }
    }
    return result;
  }

  private intersectOrGroups(items: Set<T>, orGroups: AbstractSearchTag[][]): Set<T> {
    if (items.size === 0) {
      return new Set<T>();
    }
    let result = items;

    for (const orGroup of orGroups) {
      result = intersection(this.unionItemsForTags(orGroup.map(tag => tag.value)), result);

      if (result.size === 0) {
        return new Set<T>();
      }
    }
    return result;
  }
}
