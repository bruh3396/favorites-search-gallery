import { ExpandedSearchCommand } from "../search_command/expanded_search_command";
import { SearchCommand } from "../search_command/search_command";
import { SearchTag } from "../search_tags/search_tag";
import { Searchable } from "../../../../../types/common_types";
import { SortedArray } from "../../../../../lib/components/sorted_array";
import { intersection } from "../../../../../utils/collection/set";

export class InvertedSearchIndex<T extends Searchable> {
  private readonly allSortedTags: SortedArray<string> = new SortedArray<string>();
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

  public getSearchResults(searchCommand: SearchCommand<T>, items: T[]): T[] {
    return this.getSearchResultsUsingIndex(searchCommand.query, items);
  }

  public keepIndexedTagsSorted(value: boolean): void {
    this.sortTagsOnAdd = value;
  }

  protected sortTags(): void {
    this.allSortedTags.toArray();
  }

  private getSearchResultsUsingIndex(searchQuery: string, itemsToSearch: T[]): T[] {
    const expandedCommand = new ExpandedSearchCommand(searchQuery, this.allTags);

    if (expandedCommand.isEmpty) {
      return itemsToSearch;
    }

    if (expandedCommand.hasNoMatches) {
      return [];
    }
    const negatedItems = this.getNegatedItems(expandedCommand);
    let resultItems = this.filterByNonNegatedTags(this.allItems, expandedCommand);

    if (resultItems.size === 0) {
      return [];
    }
    resultItems = this.filterByOrGroups(resultItems, expandedCommand);

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

  private getNegatedItems(command: ExpandedSearchCommand<Searchable>): Set<T> {
    const negatedItems = new Set<T>();

    for (const negatedTag of command.negatedTags) {
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

  private filterByNonNegatedTags(currentResult: Set<T>, command: ExpandedSearchCommand<Searchable>): Set<T> {
    let result = currentResult;
    const itemSets = command.nonNegatedTags.map(tag => this.tagItemMap.get(tag));

    if (itemSets.some(set => set === undefined)) {
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

  private filterByOrGroups(currentResult: Set<T>, command: ExpandedSearchCommand<Searchable>): Set<T> {
    let result = currentResult;

    for (const orGroup of command.orGroups) {
      result = intersection(this.getAllItemsInOrGroup(orGroup), result);

      if (result.size === 0) {
        return new Set<T>();
      }
    }
    return result;
  }

  private getAllItemsInOrGroup(orGroup: SearchTag[]): Set<T> {
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
