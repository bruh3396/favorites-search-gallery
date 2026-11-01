import { DensePosting, EMPTY_POSTING, Posting } from "@/core/domain/search/engines/bit/posting/posting";
import { BitIndex } from "@/core/domain/search/engines/bit/indexes/bit_index";
import { BitSet } from "@/core/domain/search/engines/bit/posting/bitset";
import { PostingResolver } from "@/core/domain/search/engines/bit/resolution/posting_resolver";
import { SearchExpression } from "@/core/domain/search/expressions/search_expression";

interface Value {
  readonly posting: Posting;
  readonly isNegated: boolean;
}

export class BitEvaluator<Doc> {
  constructor(
    private readonly bitIndex: BitIndex<Doc>,
    private readonly postingResolver: PostingResolver<Doc>
  ) { }

  public evaluate(searchExpression: SearchExpression): readonly Doc[] {
    return this.bitIndex.docsFrom(this.evaluateToBitSet(searchExpression));
  }

  public evaluateToBitSet(searchExpression: SearchExpression): BitSet {
    const value = this.resolve(searchExpression);
    const bitSet = this.bitIndex.bitSetFrom(value.posting);
    return value.isNegated ? this.bitIndex.complementOf(bitSet) : bitSet;
  }

  private resolve(searchExpression: SearchExpression): Value {
    switch (searchExpression.node.kind) {
      case "term": return { posting: this.postingResolver.resolve(searchExpression.node.term), isNegated: searchExpression.node.term.isNegated };
      case "and": return this.intersect(searchExpression.node.childExpressions);
      case "or": return this.union(searchExpression.node.childExpressions);
      case "not":
      default: {
        const value = this.resolve(searchExpression.node.childExpression);
        return { posting: value.posting, isNegated: !value.isNegated };
      }
    }
  }

  private intersect(childSearchExpressions: SearchExpression[]): Value {
    const values = childSearchExpressions.map(childSearchExpression => this.resolve(childSearchExpression));
    const { positivePostings, negativePostings } = this.partition(values);

    if (positivePostings.length === 1 && negativePostings.length === 0) {
      return { posting: positivePostings[0], isNegated: false };
    }
    const bitSet = this.intersectPostings(positivePostings);

    if (bitSet === null) {
      return { posting: EMPTY_POSTING, isNegated: false };
    }

    negativePostings.sort((a, b) => b.cardinality - a.cardinality);

    for (const negativePosting of negativePostings) {
      if (negativePosting.andNotInto(bitSet)) {
        return { posting: EMPTY_POSTING, isNegated: false };
      }
    }
    return { posting: new DensePosting(bitSet), isNegated: false };
  }

  private partition(values: Value[]): { positivePostings: Posting[]; negativePostings: Posting[] } {
    const positivePostings: Posting[] = [];
    const negativePostings: Posting[] = [];

    for (const value of values) {
      (value.isNegated ? negativePostings : positivePostings).push(value.posting);
    }
    return { positivePostings, negativePostings };
  }

  private intersectPostings(postings: Posting[]): BitSet | null {
    if (postings.length === 0) {
      return this.bitIndex.universe();
    }
    let smallestPosting = postings[0];

    for (let i = 1; i < postings.length; i += 1) {
      if (postings[i].cardinality < smallestPosting.cardinality) {
        smallestPosting = postings[i];
      }
    }
    const bitSet = smallestPosting.toBitSet(this.bitIndex.width);

    for (const positivePosting of postings) {
      if (positivePosting === smallestPosting) {
        continue;
      }

      if (positivePosting.andInto(bitSet)) {
        return null;
      }
    }
    return bitSet;
  }

  private union(childSearchExpressions: SearchExpression[]): Value {
    const bitSet = this.bitIndex.empty();
    let needsUniverseMask = false;

    for (const childSearchExpression of childSearchExpressions) {
      const value = this.resolve(childSearchExpression);

      if (value.isNegated) {
        value.posting.orComplementInto(bitSet);
        needsUniverseMask = true;
      } else {
        value.posting.orInto(bitSet);
      }
    }

    if (needsUniverseMask) {
      bitSet.andInPlace(this.bitIndex.universe());
    }
    return { posting: new DensePosting(bitSet), isNegated: false };
  }
}
