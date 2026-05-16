import { InvertedIndex } from "../../core/data_structures/inverted_index";
import { ResolvedSearchQuery } from "../query/resolved_search_query";
import { SearchQuery } from "../query/search_query";
import { Searchable } from "../../../types/search";
import { intersection } from "../../../utils/collection/set";

export class InvertedIndexSearcher<T extends Searchable> {
  constructor(private readonly index: InvertedIndex<T>) { }

  public search(query: SearchQuery<T>, docs: T[]): T[] {
    const resolvedQuery = new ResolvedSearchQuery<T>(query.rawQuery, this.index.getIndexedTerms());
    return resolvedQuery.isEmpty ? docs : resolvedQuery.isUnmatchable ? [] : this.findMatches(resolvedQuery, docs);
  }

  private findMatches(resolvedQuery: ResolvedSearchQuery<T>, docs: T[]): T[] {
    const excluded = this.docsWithAnyTerm(resolvedQuery.negatedTerms);
    const required = this.docsWithAllTerms(resolvedQuery.requiredTerms);
    const candidates = this.narrowByOrGroups(required, resolvedQuery.orGroupTerms);
    return candidates.size === 0 ? [] : docs.filter(doc => candidates.has(doc) && !excluded.has(doc));
  }

  private docsWithAnyTerm(terms: Iterable<string>): Set<T> {
    const union = new Set<T>();

    for (const term of terms) {
      this.index.getDocsForTerm(term)?.forEach(doc => union.add(doc));
    }
    return union;
  }

  private docsWithAllTerms(terms: string[]): Set<T> {
    if (terms.length === 0) {
      return this.index.getAllDocs();
    }
    const docSets = terms.map(term => this.index.getDocsForTerm(term));

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

  private narrowByOrGroups(candidates: Set<T>, orGroups: string[][]): Set<T> {
    for (const orGroup of orGroups) {
      candidates = intersection(this.docsWithAnyTerm(orGroup), candidates);

      if (candidates.size === 0) {
        return new Set<T>();
      }
    }
    return candidates;
  }
}
