import { ExpandedSearchQuery } from "../query/expanded_search_query";
import { InvertedIndex } from "../../collection/inverted_index";
import { SearchQuery } from "../query/search_query";
import { Searchable } from "../../../types/search";
import { intersection } from "../../../utils/collection/set";

export class InvertedIndexSearcher<T extends Searchable> {
  constructor(private readonly index: InvertedIndex<T>) { }

  public search(query: SearchQuery<T>, docs: T[]): T[] {
    const expandedQuery = new ExpandedSearchQuery<T>(query.rawQuery, this.index.indexedTerms());
    return expandedQuery.isEmpty ? docs : expandedQuery.isUnmatchable ? [] : this.findMatches(expandedQuery, docs);
  }

  private findMatches(expandedQuery: ExpandedSearchQuery<T>, docs: T[]): T[] {
    const excluded = this.docsWithAnyTerm(expandedQuery.negatedTerms);
    const required = this.docsWithAllTerms(expandedQuery.requiredTerms);
    const candidates = this.narrowByOrGroups(required, expandedQuery.orGroupTerms);
    return candidates.size === 0 ? [] : docs.filter(doc => candidates.has(doc) && !excluded.has(doc));
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

  private narrowByOrGroups(candidates: ReadonlySet<T>, orGroups: string[][]): Set<T> {
    let narrowed = new Set(candidates);

    for (const orGroup of orGroups) {
      narrowed = intersection(this.docsWithAnyTerm(orGroup), narrowed);

      if (narrowed.size === 0) {
        return new Set<T>();
      }
    }
    return narrowed;
  }
}
