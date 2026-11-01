import { DocResolver } from "@/core/domain/search/engines/set/resolution/doc_resolver";
import { InvertedIndex } from "@/core/domain/search/engines/set/indexes/inverted_index";
import { SearchExpression } from "@/core/domain/search/expressions/search_expression";
import { isInAllSets } from "@/core/utils/collection/set_utilities";

const SELECTIVE_QUERY_FRACTION = 0.25;
const EMPTY_EXCLUSIONS: ReadonlySet<never> = new Set<never>();

interface Value<Doc> {
  readonly docs: ReadonlySet<Doc>;
  readonly isNegated: boolean;
}

export class SetEvaluator<Doc> {
  constructor(
    private readonly invertedIndex: InvertedIndex<Doc>,
    private readonly docResolver: DocResolver<Doc>
  ) { }

  public evaluate(searchExpression: SearchExpression, docs?: readonly Doc[]): readonly Doc[] {
    const value = this.resolve(searchExpression);

    if (value.isNegated) {
      return this.materialize(this.invertedIndex.allDocs(), value.docs, docs);
    }
    return this.materialize(value.docs, EMPTY_EXCLUSIONS, docs);
  }

  private resolve(searchExpression: SearchExpression): Value<Doc> {
    const searchExpressionNode = searchExpression.node;

    switch (searchExpressionNode.kind) {
      case "term": return { docs: this.docResolver.resolve(searchExpressionNode.term), isNegated: searchExpressionNode.term.isNegated };
      case "and": return this.intersect(searchExpressionNode.childExpressions);
      case "or": return this.union(searchExpressionNode.childExpressions);
      case "not":
      default: {
        const value = this.resolve(searchExpressionNode.childExpression);
        return { docs: value.docs, isNegated: !value.isNegated };
      }
    }
  }

  private intersect(childSearchExpressions: SearchExpression[]): Value<Doc> {
    const { positives, negatives } = this.partition(childSearchExpressions.map(childSearchExpression => this.resolve(childSearchExpression)));
    const included = this.docsWithAll(positives);

    if (included.size === 0 || negatives.length === 0) {
      return { docs: included, isNegated: false };
    }
    const excluded = this.docsWithAny(negatives);
    const matches = new Set<Doc>();

    for (const doc of included) {
      if (!excluded.has(doc)) {
        matches.add(doc);
      }
    }
    return { docs: matches, isNegated: false };
  }

  private union(childSearchExpressions: SearchExpression[]): Value<Doc> {
    const { positives, negatives } = this.partition(childSearchExpressions.map(childSearchExpression => this.resolve(childSearchExpression)));

    if (negatives.length === 0) {
      return { docs: this.docsWithAny(positives), isNegated: false };
    }
    const included = this.docsWithAny(positives);
    const excludedByAll = this.docsWithAll(negatives);
    const matches = new Set<Doc>();

    for (const doc of this.invertedIndex.allDocs()) {
      if (included.has(doc) || !excludedByAll.has(doc)) {
        matches.add(doc);
      }
    }
    return { docs: matches, isNegated: false };
  }

  private partition(values: Value<Doc>[]): { positives: ReadonlySet<Doc>[]; negatives: ReadonlySet<Doc>[] } {
    const positives: ReadonlySet<Doc>[] = [];
    const negatives: ReadonlySet<Doc>[] = [];

    for (const value of values) {
      (value.isNegated ? negatives : positives).push(value.docs);
    }
    return { positives, negatives };
  }

  private materialize(candidates: ReadonlySet<Doc>, exclusions: ReadonlySet<Doc>, docs?: readonly Doc[]): readonly Doc[] {
    if (docs === undefined || candidates.size <= docs.length * SELECTIVE_QUERY_FRACTION) {
      const matchedDocs: Doc[] = [];

      for (const doc of candidates) {
        if (!exclusions.has(doc)) {
          matchedDocs.push(doc);
        }
      }
      return this.docResolver.sortByPosition(matchedDocs);
    }
    return docs.filter(doc => candidates.has(doc) && !exclusions.has(doc));
  }

  private docsWithAll(docSets: ReadonlySet<Doc>[]): ReadonlySet<Doc> {
    if (docSets.length === 0) {
      return this.invertedIndex.allDocs();
    }
    const sorted = [...docSets].sort((a, b) => a.size - b.size);
    const [smallest, ...remaining] = sorted;

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

  private docsWithAny(docSets: ReadonlySet<Doc>[]): ReadonlySet<Doc> {
    if (docSets.length === 1) {
      return docSets[0];
    }
    const docs = new Set<Doc>();

    for (const docSet of docSets) {
      docSet.forEach(doc => docs.add(doc));
    }
    return docs;
  }
}
