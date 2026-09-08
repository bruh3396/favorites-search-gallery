import { DensePosting, EmptyPosting, Posting } from "@/lib/search/engine/bitmap/bits/posting";
import { AbstractSearchTerm } from "@/lib/search/query/terms/abstract_search_term";
import { BitSet } from "@/lib/search/engine/bitmap/bits/bitset";
import { BitmapIndex } from "@/lib/search/engine/bitmap/indexes/index";
import { MetricBitmapIndex } from "@/lib/search/engine/bitmap/indexes/metric_index";
import { MetricSearchTerm } from "@/lib/search/query/terms/metric_search_term";
import { Searchable } from "@/types/search";
import { WildcardPostingResolver } from "@/lib/search/engine/bitmap/wildcard/posting_resolver";
import { WildcardSearchTerm } from "@/lib/search/query/terms/wildcard_search_term";

export interface ExpressionContext<Doc extends Searchable> {
  readonly bitmapIndex: BitmapIndex<Doc>;
  readonly metricIndex: MetricBitmapIndex<Doc>;
  readonly wildcardResolver: WildcardPostingResolver;
}

const EMPTY: Posting = new EmptyPosting();

interface Value {
  posting: Posting;
  negated: boolean;
}

type Node =
  | { kind: "term"; term: AbstractSearchTerm }
  | { kind: "and"; children: SearchExpression[] }
  | { kind: "or"; children: SearchExpression[] }
  | { kind: "not"; child: SearchExpression };

export class SearchExpression {
  private constructor(private readonly node: Node) { }

  public static term(term: AbstractSearchTerm): SearchExpression {
    return new SearchExpression({ kind: "term", term });
  }

  public static and(children: SearchExpression[]): SearchExpression {
    return new SearchExpression({ kind: "and", children });
  }

  public static or(children: SearchExpression[]): SearchExpression {
    return new SearchExpression({ kind: "or", children });
  }

  public static not(child: SearchExpression): SearchExpression {
    return new SearchExpression({ kind: "not", child });
  }

  public evaluate<Doc extends Searchable>(context: ExpressionContext<Doc>): Doc[] {
    return context.bitmapIndex.docsFrom(materialize(this.value(context), context));
  }

  private value<Doc extends Searchable>(context: ExpressionContext<Doc>): Value {
    switch (this.node.kind) {
      case "term": return { posting: positivePosting(this.node.term, context), negated: this.node.term.isNegated };
      case "and": return this.intersect(this.node.children, context);
      case "or": return this.union(this.node.children, context);
      case "not":
      default: {
        const value = this.node.child.value(context);
        return { posting: value.posting, negated: !value.negated };
      }
    }
  }

  private intersect<Doc extends Searchable>(children: SearchExpression[], context: ExpressionContext<Doc>): Value {
    const positives: Posting[] = [];
    const negatives: Posting[] = [];

    for (const child of children) {
      const value = child.value(context);

      (value.negated ? negatives : positives).push(value.posting);
    }
    return { posting: foldAnd(positives, negatives, context), negated: false };
  }

  private union<Doc extends Searchable>(children: SearchExpression[], context: ExpressionContext<Doc>): Value {
    const group = context.bitmapIndex.emptyBitSet();
    let hasComplement = false;

    for (const child of children) {
      const value = child.value(context);

      if (value.negated) {
        value.posting.orComplementInto(group);
        hasComplement = true;
      } else {
        value.posting.orInto(group);
      }
    }

    if (hasComplement) {
      group.andInPlace(context.bitmapIndex.everything());
    }
    return { posting: new DensePosting(group), negated: false };
  }
}

function foldAnd<Doc extends Searchable>(positives: Posting[], negatives: Posting[], context: ExpressionContext<Doc>): Posting {
  const result = intersectPositives(positives, context);

  negatives.sort((a, b) => b.cardinality - a.cardinality);

  for (const negative of negatives) {
    negative.andNotInto(result);
  }
  return new DensePosting(result);
}

function intersectPositives<Doc extends Searchable>(positives: Posting[], context: ExpressionContext<Doc>): BitSet {
  if (positives.length === 0) {
    return context.bitmapIndex.everything();
  }
  let smallest = positives[0];

  for (let i = 1; i < positives.length; i += 1) {
    if (positives[i].cardinality < smallest.cardinality) {
      smallest = positives[i];
    }
  }
  const result = smallest.toBitSet(context.bitmapIndex.width);

  for (const positive of positives) {
    if (positive !== smallest) {
      positive.andInto(result);
    }
  }
  return result;
}

function materialize<Doc extends Searchable>(value: Value, context: ExpressionContext<Doc>): BitSet {
  const bitset = context.bitmapIndex.emptyBitSet();

  value.posting.orInto(bitset);

  if (!value.negated) {
    return bitset;
  }
  const universe = context.bitmapIndex.everything();

  universe.andNotInPlace(bitset);
  return universe;
}

function positivePosting<Doc extends Searchable>(term: AbstractSearchTerm, context: ExpressionContext<Doc>): Posting {
  if (term instanceof WildcardSearchTerm) {
    return context.wildcardResolver.resolve(term) ?? EMPTY;
  }

  if (term instanceof MetricSearchTerm) {
    return new DensePosting(context.metricIndex.bitsetFor(term.comparison));
  }
  return context.bitmapIndex.postingForTerm(term.value) ?? EMPTY;
}
