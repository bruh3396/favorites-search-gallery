import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { InvertedIndex } from "@/lib/collection/inverted_index";
import { SearchQuery } from "@/lib/search/engine/search_query";
import { Searchable } from "@/types/search";
import { WildcardExpander } from "@/lib/search/engine/wildcard/expander";
import { intersection } from "@/utils/pure/set";

const EMPTY: ReadonlySet<unknown> = new Set();

export class IndexedSearcher<T extends Searchable> {
  constructor(private readonly index: InvertedIndex<T>, private readonly expander: WildcardExpander) { }

  public search(query: string, docs: T[]): T[] {
    const expanded = this.expander.expand(query);

    if (expanded.isUnmatchable) {
      return [];
    }
    const parsed = new SearchQuery<T>(expanded.query);
    return parsed.hasOnlyExactTerms ? this.findMatches(parsed, docs) : parsed.filter(docs);
  }

  private findMatches(parsed: SearchQuery<T>, docs: T[]): T[] {
    const required = this.docsWithAllTerms(parsed.requiredTerms);
    const candidates = this.narrowByOrGroups(required, parsed);
    const exclusions = this.docsWithAnyTerm(parsed.negatedTerms);
    return candidates.size === 0 ? [] : docs.filter(doc => candidates.has(doc) && !exclusions.has(doc));
  }

  private docsWithAllTerms(terms: string[]): ReadonlySet<T> {
    if (terms.length === 0) {
      return this.index.allDocs();
    }
    const docSets = terms.map(term => this.index.docsForTerm(term));

    if (docSets.some(set => set === undefined)) {
      return new Set<T>();
    }
    const [smallest, ...remaining] = (docSets as ReadonlySet<T>[]).sort((a, b) => a.size - b.size);
    let candidates = smallest;

    for (const docSet of remaining) {
      candidates = intersection(docSet, candidates);

      if (candidates.size === 0) {
        return new Set<T>();
      }
    }
    return candidates;
  }

  private docsWithAnyTerm(terms: Iterable<string>): ReadonlySet<T> {
    const found = new Set<T>();

    for (const term of terms) {
      this.index.docsForTerm(term)?.forEach(doc => found.add(doc));
    }
    return found;
  }

  private narrowByOrGroups(candidates: ReadonlySet<T>, parsed: SearchQuery<T>): ReadonlySet<T> {
    const [firstOrGroup, ...remainingOrGroups] = parsed.orGroups;
    const shouldStartFromFirstOrGroup = parsed.requiredTerms.length === 0 && firstOrGroup !== undefined;
    let narrowed = shouldStartFromFirstOrGroup ? this.narrowByOrGroup(candidates, firstOrGroup) : new Set(candidates);

    for (const orGroup of shouldStartFromFirstOrGroup ? remainingOrGroups : parsed.orGroups) {
      narrowed = this.narrowByOrGroup(narrowed, orGroup);

      if (narrowed.size === 0) {
        return new Set<T>();
      }
    }
    return narrowed;
  }

  private narrowByOrGroup(narrowed: ReadonlySet<T>, orGroup: AbstractSearchTerm[]): Set<T> {
    if (orGroup.some(term => term.isNegated)) {
      return this.narrowByMixedOrGroup(narrowed, orGroup);
    }
    return intersection(this.docsWithAnyTerm(orGroup.map(term => term.value)), narrowed);
  }

  private narrowByMixedOrGroup(narrowed: ReadonlySet<T>, orGroup: AbstractSearchTerm[]): Set<T> {
    const positiveUnion = this.docsWithAnyTerm(orGroup.filter(term => !term.isNegated).map(term => term.value));
    const negatedIntersection = this.docsWithAllNegatedTerms(orGroup.filter(term => term.isNegated).map(term => term.value));
    const matched = new Set<T>();

    for (const doc of narrowed) {
      if (positiveUnion.has(doc) || !negatedIntersection.has(doc)) {
        matched.add(doc);
      }
    }
    return matched;
  }

  private docsWithAllNegatedTerms(terms: string[]): ReadonlySet<T> {
    const docSets = terms.map(term => this.index.docsForTerm(term) ?? EMPTY as ReadonlySet<T>);
    const [smallest, ...remaining] = [...docSets].sort((a, b) => a.size - b.size);
    return remaining.reduce<ReadonlySet<T>>((candidates, docSet) => intersection(docSet, candidates), smallest);
  }
}
