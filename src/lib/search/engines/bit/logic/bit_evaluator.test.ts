import { describe, expect, test } from "vitest";
import { BitEvaluator } from "@/lib/search/engines/bit/logic/bit_evaluator";
import { BitIndex } from "@/lib/search/engines/bit/indexes/bit_index";
import { MetricBitIndex } from "@/lib/search/engines/bit/indexes/metric_index";
import { PostingResolver } from "@/lib/search/engines/bit/resolution/posting_resolver";
import { SearchExpression } from "@/lib/search/expression/search_expression";
import { Searchable } from "@/types/search";
import { WildcardPostingResolver } from "@/lib/search/engines/bit/resolution/wildcard_posting_resolver";
import { parseSearchTerm } from "@/lib/search/parsers/search_term_parser";

interface Item extends Searchable { id: string }

function createItem(id: string, ...tags: string[]): Item {
  return { id, tags: new Set(tags) };
}

function createEvaluator(items: Item[]): BitEvaluator<Item> {
  const bitIndex = new BitIndex<Item>(doc => doc.tags);

  bitIndex.build(items);
  const metricIndex = new MetricBitIndex<Item>(doc => doc.id.length);

  metricIndex.build(bitIndex.width, bitIndex.allDocs());
  const wildcardResolver = new WildcardPostingResolver(bitIndex);

  wildcardResolver.index(bitIndex.indexedTerms());
  const resolver = new PostingResolver(bitIndex, metricIndex, wildcardResolver);
  return new BitEvaluator(bitIndex, resolver);
}

function createLeaf(term: string): SearchExpression {
  return SearchExpression.term(parseSearchTerm(term));
}

function idsFor(items: Item[], expression: SearchExpression): string[] {
  return createEvaluator(items).evaluate(expression).map(doc => doc.id).sort();
}

const corpus: Item[] = [
  createItem("1", "red", "sweet", "small"),
  createItem("2", "red", "sour", "big"),
  createItem("3", "green", "sweet", "big"),
  createItem("4", "green", "sour", "small"),
  createItem("5", "blue", "sweet", "small")
];

describe("SearchExpression leaves", () => {
  test("a lone positive term matches the docs carrying it", () => {
    expect(idsFor(corpus, createLeaf("sweet"))).toEqual(["1", "3", "5"]);
  });

  test("a term absent from the index matches nothing", () => {
    expect(idsFor(corpus, createLeaf("nonexistent"))).toEqual([]);
  });

  test("a negated term matches every doc without it", () => {
    expect(idsFor(corpus, createLeaf("-sweet"))).toEqual(["2", "4"]);
  });
});

describe("SearchExpression AND", () => {
  test("intersects its children", () => {
    expect(idsFor(corpus, SearchExpression.and([createLeaf("red"), createLeaf("sweet")]))).toEqual(["1"]);
  });

  test("is empty when children never co-occur", () => {
    expect(idsFor(corpus, SearchExpression.and([createLeaf("red"), createLeaf("green")]))).toEqual([]);
  });

  test("an empty AND matches the whole corpus", () => {
    expect(idsFor(corpus, SearchExpression.and([]))).toEqual(["1", "2", "3", "4", "5"]);
  });

  test("folds a negated child as set subtraction", () => {
    expect(idsFor(corpus, SearchExpression.and([createLeaf("sweet"), createLeaf("-small")]))).toEqual(["3"]);
  });
});

describe("SearchExpression OR", () => {
  test("unions its children", () => {
    expect(idsFor(corpus, SearchExpression.or([createLeaf("red"), createLeaf("blue")]))).toEqual(["1", "2", "5"]);
  });

  test("an empty OR matches nothing", () => {
    expect(idsFor(corpus, SearchExpression.or([]))).toEqual([]);
  });

  test("ignores a child that matches nothing", () => {
    expect(idsFor(corpus, SearchExpression.or([createLeaf("blue"), createLeaf("nonexistent")]))).toEqual(["5"]);
  });
});

describe("SearchExpression NOT", () => {
  test("complements a subtree", () => {
    expect(idsFor(corpus, SearchExpression.not(createLeaf("sweet")))).toEqual(["2", "4"]);
  });

  test("double negation is identity", () => {
    expect(idsFor(corpus, SearchExpression.not(SearchExpression.not(createLeaf("sweet"))))).toEqual(["1", "3", "5"]);
  });

  test("negating an OR is the complement of the union", () => {
    expect(idsFor(corpus, SearchExpression.not(SearchExpression.or([createLeaf("red"), createLeaf("green")])))).toEqual(["5"]);
  });
});

describe("SearchExpression arbitrary nesting", () => {
  test("evaluates an OR of ANDs without cartesian expansion", () => {
    const expression = SearchExpression.or([
      SearchExpression.and([createLeaf("red"), createLeaf("big")]),
      SearchExpression.and([createLeaf("green"), createLeaf("small")])
    ]);

    expect(idsFor(corpus, expression)).toEqual(["2", "4"]);
  });

  test("evaluates the deeply nested example from the query language discussion", () => {
    const expression = SearchExpression.and([
      createLeaf("small"),
      SearchExpression.or([
        createLeaf("sweet"),
        SearchExpression.and([
          createLeaf("big"),
          SearchExpression.or([createLeaf("red"), createLeaf("green")])
        ])
      ])
    ]);

    expect(idsFor(corpus, expression)).toEqual(["1", "5"]);
  });

  test("mixes negation into a nested tree", () => {
    const expression = SearchExpression.and([
      SearchExpression.or([createLeaf("red"), createLeaf("green")]),
      SearchExpression.not(createLeaf("sweet"))
    ]);

    expect(idsFor(corpus, expression)).toEqual(["2", "4"]);
  });
});

describe("SearchExpression single-positive AND", () => {
  test("an AND wrapping one OR group equals the bare group", () => {
    const group = SearchExpression.or([createLeaf("red"), createLeaf("blue")]);

    expect(idsFor(corpus, SearchExpression.and([group]))).toEqual(idsFor(corpus, group));
    expect(idsFor(corpus, SearchExpression.and([group]))).toEqual(["1", "2", "5"]);
  });

  test("an AND wrapping one term equals the bare term", () => {
    expect(idsFor(corpus, SearchExpression.and([createLeaf("sweet")]))).toEqual(["1", "3", "5"]);
  });

  test("the short-circuited posting is not mutated by a later intersection", () => {
    const evaluator = createEvaluator(corpus);
    const wrapped = SearchExpression.and([createLeaf("sweet")]);
    const intersected = SearchExpression.and([createLeaf("sweet"), createLeaf("small")]);

    expect(evaluator.evaluate(wrapped).map(doc => doc.id).sort()).toEqual(["1", "3", "5"]);
    expect(evaluator.evaluate(intersected).map(doc => doc.id).sort()).toEqual(["1", "5"]);
    expect(evaluator.evaluate(wrapped).map(doc => doc.id).sort()).toEqual(["1", "3", "5"]);
  });

  test("a single-positive AND with a negated sibling still subtracts", () => {
    expect(idsFor(corpus, SearchExpression.and([createLeaf("sweet"), createLeaf("-small")]))).toEqual(["3"]);
  });
});

describe("SearchExpression wildcard and metric leaves", () => {
  test("resolves a prefix wildcard leaf", () => {
    const items = [createItem("1", "apple"), createItem("2", "banana"), createItem("3", "cherry")];

    expect(idsFor(items, createLeaf("*a*"))).toEqual(["1", "2"]);
  });

  test("resolves a metric leaf inside a nested tree", () => {
    const items = [createItem("aa", "x"), createItem("bbbb", "x"), createItem("cccccc", "y")];
    const expression = SearchExpression.and([
      createLeaf("id:>3"),
      SearchExpression.or([createLeaf("x"), createLeaf("y")])
    ]);

    expect(idsFor(items, expression)).toEqual(["bbbb", "cccccc"]);
  });
});
