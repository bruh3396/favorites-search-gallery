import { DensePosting, Posting } from "@/lib/search/engine/bitmap/posting";
import { WildcardMatchType, WildcardSearchTerm } from "@/lib/search/terms/wildcard_search_term";
import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { BitSet } from "@/lib/search/engine/bitmap/bitset";
import { BitmapIndex } from "@/lib/search/engine/bitmap/bitmap_index";
import { MetricBitmapIndex } from "@/lib/search/engine/bitmap/metric_bitmap_index";
import { MetricSearchTerm } from "@/lib/search/terms/metric_search_term";
import { SearchQuery } from "@/lib/search/engine/search_query";
import { Searchable } from "@/types/search";
import { WildcardTermResolver } from "@/lib/search/engine/set/wildcard_term_resolver";

const UNMATCHABLE = Symbol("unmatchable");

export class BitmapSearcher<Doc extends Searchable> {
  constructor(
    private readonly bitmapIndex: BitmapIndex<Doc>,
    private readonly metricIndex: MetricBitmapIndex<Doc>,
    private readonly wildcardResolver: WildcardTermResolver
  ) { }

  public search(searchQuery: SearchQuery<Doc>): Doc[] {
    const result = this.evaluate(searchQuery);
    return result === UNMATCHABLE ? [] : this.bitmapIndex.docsFrom(result);
  }

  private evaluate(searchQuery: SearchQuery<Doc>): BitSet | typeof UNMATCHABLE {
    const positives: Posting[] = [];
    const negatives: Posting[] = [];

    for (const term of searchQuery.andTerms) {
      const posting = this.resolvePositive(term);

      if (term.isNegated) {
        if (posting !== UNMATCHABLE) {
          negatives.push(posting);
        }
      } else if (posting === UNMATCHABLE) {
        return UNMATCHABLE;
      } else {
        positives.push(posting);
      }
    }

    const orGroups: Posting[] = [];

    for (const orGroup of searchQuery.orGroups) {
      const group = this.orGroupBitset(orGroup);

      if (group.isEmpty()) {
        return UNMATCHABLE;
      }
      orGroups.push(new DensePosting(group));
    }
    return this.fold(positives, negatives, orGroups);
  }

  private resolvePositive(term: AbstractSearchTerm): Posting | typeof UNMATCHABLE {
    if (term instanceof WildcardSearchTerm) {
      const terms = this.resolveWildcard(term);
      return terms.length === 0 ? UNMATCHABLE : new DensePosting(this.bitmapIndex.unionOf(terms));
    }

    if (term instanceof MetricSearchTerm) {
      return new DensePosting(this.metricIndex.bitsetFor(term.comparison));
    }
    return this.bitmapIndex.postingForTerm(term.value) ?? UNMATCHABLE;
  }

  private fold(positives: Posting[], negatives: Posting[], orGroups: Posting[]): BitSet {
    const result = this.seed(positives);

    if (result.isEmpty()) {
      return result;
    }
    negatives.sort((a, b) => b.count - a.count);

    for (const negative of negatives) {
      if (negative.andNotInto(result)) {
        return result;
      }
    }
    orGroups.sort((a, b) => a.count - b.count);

    for (const group of orGroups) {
      if (group.andInto(result)) {
        return result;
      }
    }
    return result;
  }

  private seed(positives: Posting[]): BitSet {
    if (positives.length === 0) {
      return this.bitmapIndex.everything();
    }
    let smallest = positives[0];

    for (let i = 1; i < positives.length; i += 1) {
      if (positives[i].count < smallest.count) {
        smallest = positives[i];
      }
    }
    const result = smallest.seed(this.bitmapIndex.width);

    for (const positive of positives) {
      if (positive !== smallest && positive.andInto(result)) {
        break;
      }
    }
    return result;
  }

  private orGroupBitset(orGroup: AbstractSearchTerm[]): BitSet {
    const group = this.bitmapIndex.emptyBitSet();

    for (const term of orGroup) {
      if (term instanceof WildcardSearchTerm) {
        if (!term.isNegated) {
          for (const value of this.resolveWildcard(term)) {
            this.bitmapIndex.orTermInto(group, value);
          }
        }
      } else if (term instanceof MetricSearchTerm) {
        const matches = this.metricIndex.bitsetFor(term.comparison);

        if (term.isNegated) {
          group.orComplementInPlace(matches);
        } else {
          group.orInPlace(matches);
        }
      } else if (term.isNegated) {
        const posting = this.bitmapIndex.postingForTerm(term.value);

        if (posting === undefined) {
          group.fill();
        } else {
          posting.orComplementInto(group);
        }
      } else {
        this.bitmapIndex.orTermInto(group, term.value);
      }
    }
    return group;
  }

  private resolveWildcard(term: WildcardSearchTerm): string[] {
    const inputs = term.resolutionInputs;

    switch (inputs.matchType) {
      case WildcardMatchType.Prefix: return this.wildcardResolver.termsStartingWith(inputs.fragment);
      case WildcardMatchType.Suffix: return this.wildcardResolver.termsEndingWith(inputs.fragment);
      case WildcardMatchType.Substring: return this.wildcardResolver.termsContaining(inputs.fragment);
      default: return this.wildcardResolver.termsMatching(inputs.fragments, t => inputs.regex.test(t), inputs.regex.source);
    }
  }
}
