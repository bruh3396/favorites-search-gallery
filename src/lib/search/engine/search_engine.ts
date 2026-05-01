import { AbstractSearchTag } from "../tag/abstract_search_tag";
import { InvertedIndex } from "../../core/data_structures/inverted_index";
import { ResolvedSearchQuery } from "../query/resolved_search_query";
import { SearchQuery } from "../query/search_query";
import { Searchable } from "../../../types/search";
import { intersection } from "../../../utils/collection/set";

export class SearchEngine<T extends Searchable> {
  constructor(private readonly index: InvertedIndex<T>) { }

  public search(searchQuery: SearchQuery<T>, candidates: T[]): T[] {
    const resolvedQuery = new ResolvedSearchQuery<T>(searchQuery.rawQuery, this.index.getIndexedTerms());
    return resolvedQuery.isEmpty ? candidates : resolvedQuery.isUnmatchable ? [] : this.findMatchingItems(resolvedQuery, candidates);
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
      const items = this.index.getDocsForTerm(tag);

      if (items) {
        for (const item of items) {
          matches.add(item);
        }
      }
    }
    return matches;
  }

  private findItemsWithAllTags(andTags: string[]): Set<T> {
    const tagBuckets = andTags.map(tag => this.index.getDocsForTerm(tag));

    if (tagBuckets.some(set => set === undefined)) {
      return new Set<T>();
    }
    const sortedBuckets = (tagBuckets as Set<T>[]).sort((a, b) => a.size - b.size);
    let narrowed = sortedBuckets[0] ?? this.index.getAllDocs();

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
