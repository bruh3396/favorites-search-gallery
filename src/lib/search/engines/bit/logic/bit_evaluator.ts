import { DensePosting, EMPTY_POSTING, Posting } from "@/lib/search/engines/bit/postings/posting";
import { BitIndex } from "@/lib/search/engines/bit/indexes/bit_index";
import { BitSet } from "@/lib/search/engines/bit/postings/bitset";
import { PostingResolver } from "@/lib/search/engines/bit/resolution/posting_resolver";
import { SearchExpression } from "@/lib/search/engines/bit/logic/search_expression";

interface Value {
  posting: Posting;
  negated: boolean;
}

export class BitEvaluator<Doc> {
  constructor(
    private readonly bitIndex: BitIndex<Doc>,
    private readonly postingResolver: PostingResolver<Doc>
  ) { }

  public evaluate(expression: SearchExpression): Doc[] {
    return this.bitIndex.docsFrom(this.evaluateToBitSet(expression));
  }

  public evaluateToBitSet(expression: SearchExpression): BitSet {
    const value = this.resolve(expression);
    const bitset = this.bitIndex.bitSetFrom(value.posting);
    return value.negated ? this.bitIndex.complementOf(bitset) : bitset;
  }

  private resolve(expr: SearchExpression): Value {
    switch (expr.node.kind) {
      case "term": return { posting: this.postingResolver.resolve(expr.node.term), negated: expr.node.term.isNegated };
      case "and": return this.intersect(expr.node.children);
      case "or": return this.union(expr.node.children);
      case "not":
      default: {
        const value = this.resolve(expr.node.child);
        return { posting: value.posting, negated: !value.negated };
      }
    }
  }

  private intersect(children: SearchExpression[]): Value {
    const values = children.map(child => this.resolve(child));
    const { positives, negatives } = this.partition(values);

    if (positives.length === 1 && negatives.length === 0) {
      return { posting: positives[0], negated: false };
    }
    const result = this.intersectPostings(positives);

    if (result === null) {
      return { posting: EMPTY_POSTING, negated: false };
    }

    negatives.sort((a, b) => b.cardinality - a.cardinality);

    for (const negative of negatives) {
      if (negative.andNotInto(result)) {
        return { posting: EMPTY_POSTING, negated: false };
      }
    }
    return { posting: new DensePosting(result), negated: false };
  }

  private partition(values: Value[]): { positives: Posting[]; negatives: Posting[] } {
    const positives: Posting[] = [];
    const negatives: Posting[] = [];

    for (const value of values) {
      (value.negated ? negatives : positives).push(value.posting);
    }
    return { positives, negatives };
  }

  private intersectPostings(postings: Posting[]): BitSet | null {
    if (postings.length === 0) {
      return this.bitIndex.universe();
    }
    let smallest = postings[0];

    for (let i = 1; i < postings.length; i += 1) {
      if (postings[i].cardinality < smallest.cardinality) {
        smallest = postings[i];
      }
    }
    const result = smallest.toBitSet(this.bitIndex.width);

    for (const positive of postings) {
      if (positive === smallest) {
        continue;
      }

      if (positive.andInto(result)) {
        return null;
      }
    }
    return result;
  }

  private union(children: SearchExpression[]): Value {
    const result = this.bitIndex.emptyBitSet();
    let needsUniverseMask = false;

    for (const child of children) {
      const value = this.resolve(child);

      if (value.negated) {
        value.posting.orComplementInto(result);
        needsUniverseMask = true;
      } else {
        value.posting.orInto(result);
      }
    }

    if (needsUniverseMask) {
      result.andInPlace(this.bitIndex.universe());
    }
    return { posting: new DensePosting(result), negated: false };
  }
}
