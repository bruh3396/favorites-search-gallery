import { describe, expect, test } from "vitest";
import { BitEvaluator } from "@/core/search/engines/bit/logic/bit_evaluator";
import { BitIndex } from "@/core/search/engines/bit/indexes/bit_index";
import { MetricBitIndex } from "@/core/search/engines/bit/indexes/metric_index";
import { PostingResolver } from "@/core/search/engines/bit/resolution/posting_resolver";
import { SearchExpression } from "@/core/search/expressions/search_expression";
import { Searchable } from "@/core/search/searchable";
import { WildcardPostingResolver } from "@/core/search/engines/bit/resolution/wildcard_posting_resolver";
import { parseSearchTerm } from "@/core/search/parsers/search_term_parser";

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

function evaluateIds(items: Item[], expression: SearchExpression): string[] {
  return createEvaluator(items).evaluate(expression).map(doc => doc.id).sort();
}

const corpus: Item[] = [
  createItem("1", "red", "sweet", "small"),
  createItem("2", "red", "sour", "big"),
  createItem("3", "green", "sweet", "big"),
  createItem("4", "green", "sour", "small"),
  createItem("5", "blue", "sweet", "small")
];

describe("BitEvaluator", () => {
  test("matches a lone positive term to the docs carrying it", () => {
    expect(evaluateIds(corpus, createLeaf("sweet"))).toEqual(["1", "3", "5"]);
  });

  test("matches nothing for a term absent from the index", () => {
    expect(evaluateIds(corpus, createLeaf("nonexistent"))).toEqual([]);
  });

  test("matches every doc without a negated term", () => {
    expect(evaluateIds(corpus, createLeaf("-sweet"))).toEqual(["2", "4"]);
  });

  test("intersects the children of an AND", () => {
    expect(evaluateIds(corpus, SearchExpression.and([createLeaf("red"), createLeaf("sweet")]))).toEqual(["1"]);
  });

  test("matches nothing for an AND whose children never co-occur", () => {
    expect(evaluateIds(corpus, SearchExpression.and([createLeaf("red"), createLeaf("green")]))).toEqual([]);
  });

  test("matches the whole corpus for an empty AND", () => {
    expect(evaluateIds(corpus, SearchExpression.and([]))).toEqual(["1", "2", "3", "4", "5"]);
  });

  test("folds a negated child of an AND as set subtraction", () => {
    expect(evaluateIds(corpus, SearchExpression.and([createLeaf("sweet"), createLeaf("-small")]))).toEqual(["3"]);
  });

  test("unions the children of an OR", () => {
    expect(evaluateIds(corpus, SearchExpression.or([createLeaf("red"), createLeaf("blue")]))).toEqual(["1", "2", "5"]);
  });

  test("matches nothing for an empty OR", () => {
    expect(evaluateIds(corpus, SearchExpression.or([]))).toEqual([]);
  });

  test("ignores a child of an OR that matches nothing", () => {
    expect(evaluateIds(corpus, SearchExpression.or([createLeaf("blue"), createLeaf("nonexistent")]))).toEqual(["5"]);
  });

  test("complements a NOT subtree", () => {
    expect(evaluateIds(corpus, SearchExpression.not(createLeaf("sweet")))).toEqual(["2", "4"]);
  });

  test("treats double negation as identity", () => {
    expect(evaluateIds(corpus, SearchExpression.not(SearchExpression.not(createLeaf("sweet"))))).toEqual(["1", "3", "5"]);
  });

  test("complements the union for a negated OR", () => {
    expect(evaluateIds(corpus, SearchExpression.not(SearchExpression.or([createLeaf("red"), createLeaf("green")])))).toEqual(["5"]);
  });

  test("evaluates an OR of ANDs without cartesian expansion", () => {
    const expression = SearchExpression.or([
      SearchExpression.and([createLeaf("red"), createLeaf("big")]),
      SearchExpression.and([createLeaf("green"), createLeaf("small")])
    ]);

    expect(evaluateIds(corpus, expression)).toEqual(["2", "4"]);
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

    expect(evaluateIds(corpus, expression)).toEqual(["1", "5"]);
  });

  test("mixes negation into a nested tree", () => {
    const expression = SearchExpression.and([
      SearchExpression.or([createLeaf("red"), createLeaf("green")]),
      SearchExpression.not(createLeaf("sweet"))
    ]);

    expect(evaluateIds(corpus, expression)).toEqual(["2", "4"]);
  });

  test("matches an AND wrapping one OR group like the bare group", () => {
    const group = SearchExpression.or([createLeaf("red"), createLeaf("blue")]);

    expect(evaluateIds(corpus, SearchExpression.and([group]))).toEqual(evaluateIds(corpus, group));
    expect(evaluateIds(corpus, SearchExpression.and([group]))).toEqual(["1", "2", "5"]);
  });

  test("matches an AND wrapping one term like the bare term", () => {
    expect(evaluateIds(corpus, SearchExpression.and([createLeaf("sweet")]))).toEqual(["1", "3", "5"]);
  });

  test("keeps a short-circuited posting unchanged by a later intersection", () => {
    const evaluator = createEvaluator(corpus);
    const wrapped = SearchExpression.and([createLeaf("sweet")]);
    const intersected = SearchExpression.and([createLeaf("sweet"), createLeaf("small")]);

    expect(evaluator.evaluate(wrapped).map(doc => doc.id).sort()).toEqual(["1", "3", "5"]);
    expect(evaluator.evaluate(intersected).map(doc => doc.id).sort()).toEqual(["1", "5"]);
    expect(evaluator.evaluate(wrapped).map(doc => doc.id).sort()).toEqual(["1", "3", "5"]);
  });

  test("still subtracts a negated sibling from a single-positive AND", () => {
    expect(evaluateIds(corpus, SearchExpression.and([createLeaf("sweet"), createLeaf("-small")]))).toEqual(["3"]);
  });

  test("resolves a prefix wildcard leaf", () => {
    const items = [createItem("1", "apple"), createItem("2", "banana"), createItem("3", "cherry")];

    expect(evaluateIds(items, createLeaf("*a*"))).toEqual(["1", "2"]);
  });

  test("resolves a metric leaf inside a nested tree", () => {
    const items = [createItem("aa", "x"), createItem("bbbb", "x"), createItem("cccccc", "y")];
    const expression = SearchExpression.and([
      createLeaf("id:>3"),
      SearchExpression.or([createLeaf("x"), createLeaf("y")])
    ]);

    expect(evaluateIds(items, expression)).toEqual(["bbbb", "cccccc"]);
  });
});
