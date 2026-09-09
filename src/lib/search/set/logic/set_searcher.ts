import { intersection, isInAllSets } from "@/utils/pure/set";
import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { DocResolver } from "@/lib/search/set/resolution/doc_resolver";
import { InvertedIndex } from "@/lib/search/set/indexes/inverted_index";
import { SearchQuery } from "@/lib/search/set/logic/search_query";

const SELECTIVE_QUERY_FRACTION = 0.25;

export class SetSearcher<Doc> {
  constructor(
    private readonly termIndex: InvertedIndex<Doc>,
    private readonly resolver: DocResolver<Doc>
  ) { }

  public search(searchQuery: SearchQuery<Doc>, docs: Doc[]): Doc[] {
    const { positiveTerms: requiredTerms, negatedTerms: excludedTerms } = partitionByNegation(searchQuery.andTerms);
    const hasRequiredTerms = requiredTerms.length > 0;
    const seed = hasRequiredTerms ? this.docsWithAll(requiredTerms) : this.seedFromFirstOrGroup(searchQuery.orGroups);

    if (seed.size === 0) {
      return [];
    }
    const remainingOrGroups = hasRequiredTerms ? searchQuery.orGroups : searchQuery.orGroups.slice(1);
    const candidates = this.narrowByOrGroups(seed, remainingOrGroups);

    if (candidates.size === 0) {
      return [];
    }
    const exclusions = this.docsWithAny(excludedTerms);
    return this.resolveMatches(candidates, exclusions, docs);
  }

  private resolveMatches(candidates: ReadonlySet<Doc>, exclusions: ReadonlySet<Doc>, docs: Doc[]): Doc[] {
    if (exclusions.size === 0 && candidates.size === docs.length) {
      return docs;
    }

    if (candidates.size <= docs.length * SELECTIVE_QUERY_FRACTION) {
      const matches: Doc[] = [];

      for (const doc of candidates) {
        if (!exclusions.has(doc)) {
          matches.push(doc);
        }
      }
      return this.resolver.sortByPosition(matches);
    }
    return docs.filter(doc => candidates.has(doc) && !exclusions.has(doc));
  }

  private seedFromFirstOrGroup(orGroups: AbstractSearchTerm[][]): ReadonlySet<Doc> {
    const [firstOrGroup] = orGroups;

    if (firstOrGroup === undefined) {
      return this.termIndex.allDocs();
    }
    const { positiveTerms, negatedTerms } = partitionByNegation(firstOrGroup);

    if (negatedTerms.length === 0) {
      return this.docsWithAny(positiveTerms);
    }
    return this.docsMatchingOrGroup(this.termIndex.allDocs(), positiveTerms, negatedTerms);
  }

  private narrowByOrGroups(candidates: ReadonlySet<Doc>, orGroups: AbstractSearchTerm[][]): ReadonlySet<Doc> {
    for (const orGroup of orGroups) {
      candidates = this.narrowByOrGroup(candidates, orGroup);

      if (candidates.size === 0) {
        return candidates;
      }
    }
    return candidates;
  }

  private narrowByOrGroup(candidates: ReadonlySet<Doc>, orGroup: AbstractSearchTerm[]): ReadonlySet<Doc> {
    const { positiveTerms, negatedTerms } = partitionByNegation(orGroup);

    if (negatedTerms.length === 0) {
      return intersection(this.docsWithAny(positiveTerms), candidates);
    }
    return this.docsMatchingOrGroup(candidates, positiveTerms, negatedTerms);
  }

  private docsMatchingOrGroup(candidates: ReadonlySet<Doc>, positiveTerms: AbstractSearchTerm[], negatedTerms: AbstractSearchTerm[]): ReadonlySet<Doc> {
    const positiveUnion = this.docsWithAny(positiveTerms);
    const negatedIntersection = this.docsWithAll(negatedTerms);
    const matches = new Set<Doc>();

    for (const candidate of candidates) {
      if (positiveUnion.has(candidate) || !negatedIntersection.has(candidate)) {
        matches.add(candidate);
      }
    }
    return matches;
  }

  private docsWithAll(terms: AbstractSearchTerm[]): ReadonlySet<Doc> {
    if (terms.length === 0) {
      return this.termIndex.allDocs();
    }
    const docSets = terms.map(term => this.resolver.docsFor(term)).sort((a, b) => a.size - b.size);
    const [smallest, ...remaining] = docSets;

    if (smallest.size === 0 || remaining.length === 0) {
      return smallest;
    }
    const docs = new Set<Doc>();

    for (const doc of smallest) {
      if (isInAllSets(doc, remaining)) {
        docs.add(doc);
      }
    }
    return docs;
  }

  private docsWithAny(terms: AbstractSearchTerm[]): ReadonlySet<Doc> {
    if (terms.length === 1) {
      return this.resolver.docsFor(terms[0]);
    }
    const docs = new Set<Doc>();

    for (const term of terms) {
      this.resolver.docsFor(term).forEach(doc => docs.add(doc));
    }
    return docs;
  }
}

function partitionByNegation(terms: AbstractSearchTerm[]): {
  positiveTerms: AbstractSearchTerm[];
  negatedTerms: AbstractSearchTerm[];
} {
  const positiveTerms: AbstractSearchTerm[] = [];
  const negatedTerms: AbstractSearchTerm[] = [];

  for (const term of terms) {
    (term.isNegated ? negatedTerms : positiveTerms).push(term);
  }
  return { positiveTerms, negatedTerms };
}
