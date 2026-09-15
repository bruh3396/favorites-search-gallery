import { DocResolver } from "@/lib/search/engines/set/resolution/doc_resolver";
import { InvertedIndex } from "@/lib/search/engines/set/indexes/inverted_index";
import { SearchExpression } from "@/lib/search/expression/search_expression";
import { isInAllSets } from "@/utils/pure/set";

const SELECTIVE_QUERY_FRACTION = 0.25;
const EMPTY_EXCLUSIONS: ReadonlySet<never> = new Set<never>();

interface Value<Doc> {
  docs: ReadonlySet<Doc>;
  isNegated: boolean;
}

export class SetEvaluator<Doc> {
  constructor(
    private readonly termIndex: InvertedIndex<Doc>,
    private readonly resolver: DocResolver<Doc>
  ) { }

  public evaluate(expression: SearchExpression, docs: Doc[]): Doc[] {
    const value = this.resolve(expression);

    if (value.isNegated) {
      return this.materialize(this.termIndex.allDocs(), value.docs, docs);
    }
    return this.materialize(value.docs, EMPTY_EXCLUSIONS, docs);
  }

  private resolve(expression: SearchExpression): Value<Doc> {
    const node = expression.node;

    switch (node.kind) {
      case "term": return { docs: this.resolver.resolve(node.term), isNegated: node.term.isNegated };
      case "and": return this.intersect(node.children);
      case "or": return this.union(node.children);
      case "not":
      default: {
        const value = this.resolve(node.child);
        return { docs: value.docs, isNegated: !value.isNegated };
      }
    }
  }

  private intersect(children: SearchExpression[]): Value<Doc> {
    const { positives, negatives } = this.partition(children.map(child => this.resolve(child)));
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

  private union(children: SearchExpression[]): Value<Doc> {
    const { positives, negatives } = this.partition(children.map(child => this.resolve(child)));

    if (negatives.length === 0) {
      return { docs: this.docsWithAny(positives), isNegated: false };
    }
    const included = this.docsWithAny(positives);
    const excludedByAll = this.docsWithAll(negatives);
    const matches = new Set<Doc>();

    for (const doc of this.termIndex.allDocs()) {
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

  private materialize(candidates: ReadonlySet<Doc>, exclusions: ReadonlySet<Doc>, docs: Doc[]): Doc[] {
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

  private docsWithAll(docSets: ReadonlySet<Doc>[]): ReadonlySet<Doc> {
    if (docSets.length === 0) {
      return this.termIndex.allDocs();
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
