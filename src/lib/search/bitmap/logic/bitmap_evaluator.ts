import { DensePosting, EMPTY_POSTING, Posting } from "@/lib/search/bitmap/postings/posting";
import { BitSet } from "@/lib/search/bitmap/postings/bitset";
import { BitmapIndex } from "@/lib/search/bitmap/indexes/bitmap_index";
import { PostingResolver } from "@/lib/search/bitmap/resolution/posting_resolver";
import { SearchExpression } from "@/lib/search/bitmap/logic/search_expression";

interface Value {
  posting: Posting;
  negated: boolean;
}

export class BitmapEvaluator<Doc> {
  constructor(
    private readonly bitmapIndex: BitmapIndex<Doc>,
    private readonly resolver: PostingResolver<Doc>
  ) { }

  public evaluate(expression: SearchExpression): Doc[] {
    return this.bitmapIndex.docsFrom(this.evaluateToBitSet(expression));
  }

  public evaluateToBitSet(expression: SearchExpression): BitSet {
    const value = this.resolve(expression);
    const bitset = this.bitmapIndex.bitSetFrom(value.posting);
    return value.negated ? this.bitmapIndex.complementOf(bitset) : bitset;
  }

  private resolve(expr: SearchExpression): Value {
    switch (expr.node.kind) {
      case "term": return { posting: this.resolver.resolve(expr.node.term), negated: expr.node.term.isNegated };
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
      return this.bitmapIndex.universe();
    }
    let smallest = postings[0];

    for (let i = 1; i < postings.length; i += 1) {
      if (postings[i].cardinality < smallest.cardinality) {
        smallest = postings[i];
      }
    }
    const result = smallest.toBitSet(this.bitmapIndex.width);

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
    const result = this.bitmapIndex.emptyBitSet();
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
      result.andInPlace(this.bitmapIndex.universe());
    }
    return { posting: new DensePosting(result), negated: false };
  }
}
