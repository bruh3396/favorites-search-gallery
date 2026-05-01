import { AbstractSearchTag } from "../tag/abstract_search_tag";
import { ResolvedSearchQuery } from "../query/resolved_search_query";
import { SearchQuery } from "../query/search_query";
import { Searchable } from "../../../types/search";
import { SortedArray } from "../../core/data_structures/sorted_array";
import { intersection } from "../../../utils/collection/set";

export class InvertedIndex3<T extends Searchable> {
  protected readonly indexedTags: SortedArray<string> = new SortedArray<string>();
  private readonly indexedItems: Set<T> = new Set<T>();
  private readonly itemsByTag: Map<string, Set<T>> = new Map<string, Set<T>>();

  constructor(private maintainingSortOrder: boolean = false) { }

  public getIndexedTags(): string[] {
    return this.indexedTags.toArray();
  }

  public addItem(item: T): void {
    this.indexedItems.add(item);

    for (const tag of item.tags) {
      let items = this.itemsByTag.get(tag);

      if (items === undefined) {
        items = new Set<T>();
        this.itemsByTag.set(tag, items);
        this.addTag(tag);
      }
      items.add(item);
    }
  }

  public removeItem(item: T): void {
    this.indexedItems.delete(item);

    for (const tag of item.tags) {
      const items = this.itemsByTag.get(tag);

      if (items !== undefined) {
        items.delete(item);
      }
    }
  }

  public search(searchQuery: SearchQuery<T>, candidates: T[]): T[] {
    const resolvedQuery = new ResolvedSearchQuery<T>(searchQuery.rawQuery, this.getIndexedTags());
    return resolvedQuery.isEmpty ? candidates : resolvedQuery.isUnmatchable ? [] : this.findMatchingItems(resolvedQuery, candidates);
  }

  public maintainSortOrder(value: boolean): void {
    this.maintainingSortOrder = value;
  }

  private addTag(tag: string): void {
    if (this.maintainingSortOrder) {
      this.indexedTags.insert(tag);
    } else {
      this.indexedTags.push(tag);
    }
  }

  private findMatchingItems(resolvedQuery: ResolvedSearchQuery<T>, candidates: T[]): T[] {
    const exclusions = this.collectItemsWithAnyTag(resolvedQuery.negatedTags);
    const andMatches = this.findItemsWithAllTags(resolvedQuery.positiveAndTags);
    const matches = this.findItemsMatchingAllOrGroups(andMatches, resolvedQuery.orGroups);
    return matches.size === 0 ? [] : candidates.filter(candidate => matches.has(candidate) && !exclusions.has(candidate));
  }

  private collectItemsWithAnyTag(tags: Iterable<string>): Set<T> {
    const matches = new Set<T>();

    for (const tag of tags) {
      this.itemsByTag.get(tag)?.forEach(item => matches.add(item));
    }
    return matches;
  }

  private findItemsWithAllTags(andTags: string[]): Set<T> {
    const tagBuckets = andTags.map(tag => this.itemsByTag.get(tag));

    if (tagBuckets.some(set => set === undefined)) {
      return new Set<T>();
    }
    const sortedBuckets = (tagBuckets as Set<T>[]).sort((a, b) => a.size - b.size);
    let narrowed = sortedBuckets[0] ?? this.indexedItems;

    for (const tagSet of sortedBuckets.slice(1)) {
      narrowed = intersection(tagSet, narrowed);

      if (narrowed.size === 0) {
        return new Set<T>();
      }
    }
    return narrowed;
  }

  private findItemsMatchingAllOrGroups(candidates: Set<T>, orGroups: AbstractSearchTag[][]): Set<T> {
    if (candidates.size === 0) {
      return new Set<T>();
    }
    let narrowed = candidates;

    for (const orGroup of orGroups) {
      narrowed = intersection(this.collectItemsWithAnyTag(orGroup.map(tag => tag.value)), narrowed);

      if (narrowed.size === 0) {
        return new Set<T>();
      }
    }
    return narrowed;
  }
}
