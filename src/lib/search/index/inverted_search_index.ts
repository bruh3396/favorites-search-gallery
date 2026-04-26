import { AbstractSearchTag } from "../tag/abstract_search_tag";
import { ExpandedSearchQuery } from "../query/expanded_search_query";
import { SearchQuery } from "../query/search_query";
import { Searchable } from "../../../types/common_types";
import { SortedArray } from "../../core/structures/sorted_array";
import { intersection } from "../../../utils/primitives/set";

export class InvertedSearchIndex<T extends Searchable> {
  protected readonly allSortedTags: SortedArray<string> = new SortedArray<string>();
  private readonly allItems: Set<T> = new Set<T>();
  private readonly tagItemMap: Map<string, Set<T>> = new Map<string, Set<T>>();
  private sortTagsOnAdd: boolean = false;

  public get allTags(): string[] {
    return this.allSortedTags.toArray();
  }

  public add(item: T): void {
    this.allItems.add(item);

    for (const tag of item.tags) {
      let indexedItems = this.tagItemMap.get(tag);

      if (indexedItems === undefined) {
        indexedItems = new Set<T>();
        this.tagItemMap.set(tag, indexedItems);
        this.addTag(tag);
      }
      indexedItems.add(item);
    }
  }

  public remove(item: T): void {
    for (const tag of item.tags) {
      const indexedItems = this.tagItemMap.get(tag);

      if (indexedItems !== undefined) {
        indexedItems.delete(item);
      }
    }
  }

  public search(searchQuery: SearchQuery<T>, items: T[]): T[] {
    return this.searchUsingIndex(searchQuery.rawQuery, items);
  }

  public keepTagsSorted(): void {
    this.sortTagsOnAdd = true;
  }

  public doNotKeepTagsSorted(): void {
    this.sortTagsOnAdd = false;
  }

  private searchUsingIndex(searchQuery: string, itemsToSearch: T[]): T[] {
    const expandedQuery = new ExpandedSearchQuery(searchQuery, this.allTags);

    if (expandedQuery.isEmpty) {
      return itemsToSearch;
    }

    if (expandedQuery.hasNoMatches) {
      return [];
    }
    const negatedItems = this.getNegatedItems(expandedQuery);
    let resultItems = this.filterByNonNegatedTags(this.allItems, expandedQuery);

    if (resultItems.size === 0) {
      return [];
    }
    resultItems = this.filterByOrGroups(resultItems, expandedQuery);

    if (resultItems.size === 0) {
      return [];
    }
    return itemsToSearch.filter(item => resultItems.has(item) && !negatedItems.has(item));
  }

  private addTag(tag: string): void {
    if (this.sortTagsOnAdd) {
      this.allSortedTags.insert(tag);
    } else {
      this.allSortedTags.push(tag);
    }
  }

  private getNegatedItems(query: ExpandedSearchQuery<Searchable>): Set<T> {
    const negatedItems = new Set<T>();

    for (const negatedTag of query.negatedTags) {
      const itemsWithNegatedTag = this.tagItemMap.get(negatedTag);

      if (itemsWithNegatedTag === undefined) {
        continue;
      }

      for (const item of itemsWithNegatedTag) {
        negatedItems.add(item);
      }
    }
    return negatedItems;
  }

  private filterByNonNegatedTags(currentResult: Set<T>, query: ExpandedSearchQuery<Searchable>): Set<T> {
    let result = currentResult;
    const itemSets = query.positiveAndTags.map(tag => this.tagItemMap.get(tag));

    if (itemSets.some(itemSet => itemSet === undefined)) {
      return new Set<T>();
    }

    for (const itemSet of (itemSets as Set<T>[]).sort((a, b) => a.size - b.size)) {
      result = intersection(itemSet, result);

      if (result.size === 0) {
        return new Set<T>();
      }
    }
    return result;
  }

  private filterByOrGroups(currentResult: Set<T>, query: ExpandedSearchQuery<Searchable>): Set<T> {
    let result = currentResult;

    for (const orGroup of query.orGroups) {
      result = intersection(this.getAllItemsInOrGroup(orGroup), result);

      if (result.size === 0) {
        return new Set<T>();
      }
    }
    return result;
  }

  private getAllItemsInOrGroup(orGroup: AbstractSearchTag[]): Set<T> {
    const allItemsInOrGroup = new Set<T>();

    for (const tag of orGroup) {
      const itemsWithTag = this.tagItemMap.get(tag.value);

      if (itemsWithTag === undefined) {
        continue;
      }

      for (const item of itemsWithTag) {
        allItemsInOrGroup.add(item);
      }
    }
    return allItemsInOrGroup;
  }
}
