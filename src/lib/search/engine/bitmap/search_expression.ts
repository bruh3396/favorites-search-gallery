import { DensePosting, Posting } from "@/lib/search/engine/bitmap/posting";
import { AbstractSearchTerm } from "@/lib/search/terms/abstract_search_term";
import { BitSet } from "@/lib/search/engine/bitmap/bitset";
import { BitmapIndex } from "@/lib/search/engine/bitmap/bitmap_index";
import { MetricBitmapIndex } from "@/lib/search/engine/bitmap/metric_bitmap_index";
import { MetricSearchTerm } from "@/lib/search/terms/metric_search_term";
import { Searchable } from "@/types/search";
import { WildcardPostingResolver } from "@/lib/search/engine/bitmap/wildcard_posting_resolver";
import { WildcardSearchTerm } from "@/lib/search/terms/wildcard_search_term";

export interface ExpressionContext<Doc extends Searchable> {
  readonly bitmapIndex: BitmapIndex<Doc>;
  readonly metricIndex: MetricBitmapIndex<Doc>;
  readonly wildcardResolver: WildcardPostingResolver;
}

const EMPTY = Symbol("empty");

interface Value {
  posting: Posting | typeof EMPTY;
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

  public search<Doc extends Searchable>(context: ExpressionContext<Doc>): Doc[] {
    return context.bitmapIndex.docsFrom(materialize(this.value(context), context));
  }

  private value<Doc extends Searchable>(context: ExpressionContext<Doc>): Value {
    switch (this.node.kind) {
      case "term": return this.termValue(this.node.term, context);
      case "and": return this.intersect(this.node.children, context);
      case "or": return this.union(this.node.children, context);
      case "not":
      default: return negate(this.node.child.value(context));
    }
  }

  private termValue<Doc extends Searchable>(term: AbstractSearchTerm, context: ExpressionContext<Doc>): Value {
    return { posting: positivePosting(term, context), negated: term.isNegated };
  }

  private intersect<Doc extends Searchable>(children: SearchExpression[], context: ExpressionContext<Doc>): Value {
    const positives: Posting[] = [];
    const negatives: Posting[] = [];

    for (const child of children) {
      const value = child.value(context);

      if (value.negated) {
        if (value.posting !== EMPTY) {
          negatives.push(value.posting);
        }
      } else {
        if (value.posting === EMPTY) {
          return { posting: EMPTY, negated: false };
        }
        positives.push(value.posting);
      }
    }
    return { posting: foldAnd(positives, negatives, context), negated: false };
  }

  private union<Doc extends Searchable>(children: SearchExpression[], context: ExpressionContext<Doc>): Value {
    const group = context.bitmapIndex.emptyBitSet();
    let hasComplement = false;

    for (const child of children) {
      const value = child.value(context);

      if (value.negated) {
        orComplementInto(value.posting, group);
        hasComplement = true;
      } else if (value.posting !== EMPTY) {
        value.posting.orInto(group);
      }
    }

    if (hasComplement) {
      group.andInPlace(context.bitmapIndex.everything());
    }
    return { posting: group.isEmpty() ? EMPTY : new DensePosting(group), negated: false };
  }
}

function foldAnd<Doc extends Searchable>(positives: Posting[], negatives: Posting[], context: ExpressionContext<Doc>): Posting | typeof EMPTY {
  const { result, isEmpty } = seed(positives, context);

  if (isEmpty) {
    return EMPTY;
  }
  negatives.sort((a, b) => b.count - a.count);

  for (const negative of negatives) {
    if (negative.andNotInto(result)) {
      return EMPTY;
    }
  }
  return new DensePosting(result);
}

function seed<Doc extends Searchable>(positives: Posting[], context: ExpressionContext<Doc>): { result: BitSet; isEmpty: boolean } {
  if (positives.length === 0) {
    return { result: context.bitmapIndex.everything(), isEmpty: false };
  }
  let smallest = positives[0];

  for (let i = 1; i < positives.length; i += 1) {
    if (positives[i].count < smallest.count) {
      smallest = positives[i];
    }
  }
  const result = smallest.toBitSet(context.bitmapIndex.width);

  for (const positive of positives) {
    if (positive === smallest) {
      continue;
    }

    if (positive.andInto(result)) {
      return { result, isEmpty: true };
    }
  }
  return { result, isEmpty: false };
}

function materialize<Doc extends Searchable>(value: Value, context: ExpressionContext<Doc>): BitSet {
  return value.negated ? materializeNegated(value.posting, context) : materializePositive(value.posting, context);
}

function materializePositive<Doc extends Searchable>(posting: Posting | typeof EMPTY, context: ExpressionContext<Doc>): BitSet {
  return posting === EMPTY ? context.bitmapIndex.emptyBitSet() : postingBitset(posting, context);
}

function materializeNegated<Doc extends Searchable>(posting: Posting | typeof EMPTY, context: ExpressionContext<Doc>): BitSet {
  if (posting === EMPTY) {
    return context.bitmapIndex.everything();
  }
  const universe = context.bitmapIndex.everything();

  universe.andNotInPlace(postingBitset(posting, context));
  return universe;
}

function postingBitset<Doc extends Searchable>(posting: Posting, context: ExpressionContext<Doc>): BitSet {
  const bitset = context.bitmapIndex.emptyBitSet();

  posting.orInto(bitset);
  return bitset;
}

function orComplementInto(posting: Posting | typeof EMPTY, group: BitSet): void {
  if (posting === EMPTY) {
    group.fill();
  } else {
    posting.orComplementInto(group);
  }
}

function negate(value: Value): Value {
  return { posting: value.posting, negated: !value.negated };
}

function positivePosting<Doc extends Searchable>(term: AbstractSearchTerm, context: ExpressionContext<Doc>): Posting | typeof EMPTY {
  if (term instanceof WildcardSearchTerm) {
    return context.wildcardResolver.resolve(term) ?? EMPTY;
  }

  if (term instanceof MetricSearchTerm) {
    return new DensePosting(context.metricIndex.bitsetFor(term.comparison));
  }
  return context.bitmapIndex.postingForTerm(term.value) ?? EMPTY;
}
