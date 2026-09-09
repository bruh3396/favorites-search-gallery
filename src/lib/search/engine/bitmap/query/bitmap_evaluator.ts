import { DensePosting, EMPTY_POSTING, Posting } from "@/lib/search/engine/bitmap/bits/posting";
import { BitSet } from "@/lib/search/engine/bitmap/bits/bitset";
import { BitmapIndex } from "@/lib/search/engine/bitmap/indexes/index";
import { PostingResolver } from "@/lib/search/engine/bitmap/query/posting_resolver";
import { SearchExpression } from "@/lib/search/engine/bitmap/query/expression";
import { Searchable } from "@/types/search";

interface Value {
  posting: Posting;
  negated: boolean;
}

export class BitmapEvaluator<Doc extends Searchable> {
  constructor(
    private readonly bitmapIndex: BitmapIndex<Doc>,
    private readonly resolver: PostingResolver<Doc>
  ) { }

  public evaluate(expression: SearchExpression): Doc[] {
    const value = this.resolve(expression);
    const bitset = this.bitmapIndex.bitSetFrom(value.posting);
    const result = value.negated ? this.bitmapIndex.complementOf(bitset) : bitset;
    return this.bitmapIndex.docsFrom(result);
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
    const { positives, negatives } = this.partitionByNegation(children);
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

  private partitionByNegation(children: SearchExpression[]): { positives: Posting[]; negatives: Posting[] } {
    const positives: Posting[] = [];
    const negatives: Posting[] = [];

    for (const child of children) {
      const value = this.resolve(child);

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
