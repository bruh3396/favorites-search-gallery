import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { DocsResolver } from "@/lib/search/engine/docs_resolver";
import { SearchQuery } from "@/lib/search/engine/search_query";
import { Searchable } from "@/types/search";
import { intersection } from "@/utils/pure/set";

interface AndTermPartition {
  requiredTerms: AbstractSearchTerm[];
  negatedTerms: AbstractSearchTerm[];
}

export class InvertedIndexedSearcher<T extends Searchable> {
  constructor(private readonly resolver: DocsResolver<T>) { }

  public search(searchQuery: SearchQuery<T>, docs: T[]): T[] {
    this.resolver.prime(searchQuery);
    const partition = partitionAndTerms(searchQuery.andTerms);
    const required = this.docsWithAllTerms(partition.requiredTerms);
    const candidates = this.narrowByOrGroups(required, searchQuery, partition);
    const exclusions = this.docsWithAnyTerm(partition.negatedTerms);
    return candidates.size === 0 ? [] : docs.filter(doc => candidates.has(doc) && !exclusions.has(doc));
  }

  private docsWithAllTerms(terms: AbstractSearchTerm[]): ReadonlySet<T> {
    if (terms.length === 0) {
      return this.resolver.allDocs();
    }
    const docSets = terms.map(term => this.resolver.docsFor(term));
    const [smallest, ...remaining] = docSets.sort((a, b) => a.size - b.size);
    let candidates = smallest;

    for (const docSet of remaining) {
      candidates = intersection(docSet, candidates);

      if (candidates.size === 0) {
        return new Set<T>();
      }
    }
    return candidates;
  }

  private docsWithAnyTerm(terms: Iterable<AbstractSearchTerm>): ReadonlySet<T> {
    const found = new Set<T>();

    for (const term of terms) {
      this.resolver.docsFor(term).forEach(doc => found.add(doc));
    }
    return found;
  }

  private narrowByOrGroups(candidates: ReadonlySet<T>, parsed: SearchQuery<T>, partition: AndTermPartition): ReadonlySet<T> {
    const [firstOrGroup, ...remainingOrGroups] = parsed.orGroups;
    const shouldStartFromFirstOrGroup = partition.requiredTerms.length === 0 && firstOrGroup !== undefined;
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
    return intersection(this.docsWithAnyTerm(orGroup), narrowed);
  }

  private narrowByMixedOrGroup(narrowed: ReadonlySet<T>, orGroup: AbstractSearchTerm[]): Set<T> {
    const positiveUnion = this.docsWithAnyTerm(orGroup.filter(term => !term.isNegated));
    const negatedIntersection = this.docsWithAllTerms(orGroup.filter(term => term.isNegated));
    const matched = new Set<T>();

    for (const doc of narrowed) {
      if (positiveUnion.has(doc) || !negatedIntersection.has(doc)) {
        matched.add(doc);
      }
    }
    return matched;
  }
}

function partitionAndTerms(andTerms: AbstractSearchTerm[]): AndTermPartition {
  const requiredTerms: AbstractSearchTerm[] = [];
  const negatedTerms: AbstractSearchTerm[] = [];

  for (const term of andTerms) {
    (term.isNegated ? negatedTerms : requiredTerms).push(term);
  }
  return { requiredTerms, negatedTerms };
}
