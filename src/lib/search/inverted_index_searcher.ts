import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { ExpandedSearchQuery } from "@/lib/search/query/expanded_search_query";
import { InvertedIndex } from "@/lib/collection/inverted_index";
import { Searchable } from "@/types/search";
import { intersection } from "@/utils/pure/set";

export class InvertedIndexSearcher<T extends Searchable> {
  constructor(private readonly index: InvertedIndex<T>) { }

  public search(query: string, docs: T[]): T[] {
    const expandedQuery = new ExpandedSearchQuery<T>(query, this.index.indexedTerms());
    return expandedQuery.isEmpty ? docs : expandedQuery.isUnmatchable ? [] : this.findMatches(expandedQuery, docs);
  }

  private findMatches(expandedQuery: ExpandedSearchQuery<T>, docs: T[]): T[] {
    const required = this.docsWithAllTerms(expandedQuery.requiredTerms);
    const candidates = this.narrowByOrGroups(required, expandedQuery.orGroups);
    const exclusions = this.docsWithAnyTerm(expandedQuery.negatedTerms);
    return candidates.size === 0 ? [] : docs.filter(doc => candidates.has(doc) && !exclusions.has(doc));
  }

  private docsWithAnyTerm(terms: Iterable<string>): Set<T> {
    const union = new Set<T>();

    for (const term of terms) {
      this.index.docsForTerm(term)?.forEach(doc => union.add(doc));
    }
    return union;
  }

  private docsWithAllTerms(terms: string[]): ReadonlySet<T> {
    if (terms.length === 0) {
      return this.index.allDocs();
    }
    const docSets = terms.map(term => this.index.docsForTerm(term));

    if (docSets.some(set => set === undefined)) {
      return new Set<T>();
    }
    const [smallest, ...remaining] = (docSets as Set<T>[]).sort((a, b) => a.size - b.size);
    let candidates = smallest;

    for (const docSet of remaining) {
      candidates = intersection(docSet, candidates);

      if (candidates.size === 0) {
        return new Set<T>();
      }
    }
    return candidates;
  }

  private narrowByOrGroups(candidates: ReadonlySet<T>, orGroups: AbstractSearchTerm[][]): Set<T> {
    let narrowed = new Set(candidates);

    for (const orGroup of orGroups) {
      narrowed = this.narrowByOrGroup(narrowed, orGroup);

      if (narrowed.size === 0) {
        return new Set<T>();
      }
    }
    return narrowed;
  }

  private narrowByOrGroup(candidates: Set<T>, orGroup: AbstractSearchTerm[]): Set<T> {
    return orGroup.some(searchTerm => searchTerm.isNegated) ? this.keepDocsMatchingAnyTerm(candidates, orGroup) : this.keepDocsIndexedByAnyTerm(candidates, orGroup);
  }

  private keepDocsMatchingAnyTerm(candidates: Set<T>, orGroup: AbstractSearchTerm[]): Set<T> {
    return new Set([...candidates].filter(doc => orGroup.some(searchTerm => searchTerm.matches(doc))));
  }

  private keepDocsIndexedByAnyTerm(candidates: Set<T>, orGroup: AbstractSearchTerm[]): Set<T> {
    return intersection(this.docsWithAnyTerm(orGroup.map(searchTerm => searchTerm.value)), candidates);
  }
}
