import { describe, expect, test } from "vitest";
import { BitEvaluator } from "@/core/domain/search/engines/bit/logic/bit_evaluator";
import { BitIndex } from "@/core/domain/search/engines/bit/indexes/bit_index";
import { MetricBitIndex } from "@/core/domain/search/engines/bit/indexes/metric_bit_index";
import { PostingResolver } from "@/core/domain/search/engines/bit/resolution/posting_resolver";
import { SearchExpression } from "@/core/domain/search/expressions/search_expression";
import { Searchable } from "@/core/domain/search/searchable";
import { WildcardPostingResolver } from "@/core/domain/search/engines/bit/resolution/wildcard_posting_resolver";
import { parseSearchTerm } from "@/core/domain/search/parsers/search_term_parser";
import { StringInterner } from "@/core/utils/string/string_interner";

interface Item extends Searchable { id: string }

function createItem(id: string, ...tags: string[]): Item {
  return { id, tags: new Set(tags) };
}

function createEvaluator(items: Item[]): BitEvaluator<Item> {
  const bitIndex = new BitIndex<Item>({ getTerms: item => item.tags, stringInterner: new StringInterner() });

  bitIndex.build(items);
  const metricBitIndex = new MetricBitIndex<Item>(item => item.id.length);

  metricBitIndex.build(bitIndex.width, bitIndex.allDocs());
  const wildcardPostingResolver = new WildcardPostingResolver({ bitIndex, stringInterner: new StringInterner() });

  wildcardPostingResolver.index(bitIndex.indexedTerms());
  const postingResolver = new PostingResolver(bitIndex, metricBitIndex, wildcardPostingResolver);
  return new BitEvaluator(bitIndex, postingResolver);
}

function createLeaf(term: string): SearchExpression {
  return SearchExpression.term(parseSearchTerm(term));
}

function evaluateIds(items: Item[], searchExpression: SearchExpression): string[] {
  return createEvaluator(items).evaluate(searchExpression).map(item => item.id).sort();
}

const items: Item[] = [
  createItem("1", "red", "sweet", "small"),
  createItem("2", "red", "sour", "big"),
  createItem("3", "green", "sweet", "big"),
  createItem("4", "green", "sour", "small"),
  createItem("5", "blue", "sweet", "small")
];

describe("BitEvaluator", () => {
  test("matches a lone positive term to the docs carrying it", () => {
    expect(evaluateIds(items, createLeaf("sweet"))).toEqual(["1", "3", "5"]);
  });

  test("matches nothing for a term absent from the index", () => {
    expect(evaluateIds(items, createLeaf("nonexistent"))).toEqual([]);
  });

  test("matches every doc without a negated term", () => {
    expect(evaluateIds(items, createLeaf("-sweet"))).toEqual(["2", "4"]);
  });

  test("intersects the children of an AND", () => {
    expect(evaluateIds(items, SearchExpression.and([createLeaf("red"), createLeaf("sweet")]))).toEqual(["1"]);
  });

  test("matches nothing for an AND whose children never co-occur", () => {
    expect(evaluateIds(items, SearchExpression.and([createLeaf("red"), createLeaf("green")]))).toEqual([]);
  });

  test("matches the whole corpus for an empty AND", () => {
    expect(evaluateIds(items, SearchExpression.and([]))).toEqual(["1", "2", "3", "4", "5"]);
  });

  test("folds a negated child of an AND as set subtraction", () => {
    expect(evaluateIds(items, SearchExpression.and([createLeaf("sweet"), createLeaf("-small")]))).toEqual(["3"]);
  });

  test("unions the children of an OR", () => {
    expect(evaluateIds(items, SearchExpression.or([createLeaf("red"), createLeaf("blue")]))).toEqual(["1", "2", "5"]);
  });

  test("matches nothing for an empty OR", () => {
    expect(evaluateIds(items, SearchExpression.or([]))).toEqual([]);
  });

  test("ignores a child of an OR that matches nothing", () => {
    expect(evaluateIds(items, SearchExpression.or([createLeaf("blue"), createLeaf("nonexistent")]))).toEqual(["5"]);
  });

  test("complements a NOT subtree", () => {
    expect(evaluateIds(items, SearchExpression.not(createLeaf("sweet")))).toEqual(["2", "4"]);
  });

  test("treats double negation as identity", () => {
    expect(evaluateIds(items, SearchExpression.not(SearchExpression.not(createLeaf("sweet"))))).toEqual(["1", "3", "5"]);
  });

  test("complements the union for a negated OR", () => {
    expect(evaluateIds(items, SearchExpression.not(SearchExpression.or([createLeaf("red"), createLeaf("green")])))).toEqual(["5"]);
  });

  test("evaluates an OR of ANDs without cartesian expansion", () => {
    const searchExpression = SearchExpression.or([
      SearchExpression.and([createLeaf("red"), createLeaf("big")]),
      SearchExpression.and([createLeaf("green"), createLeaf("small")])
    ]);

    expect(evaluateIds(items, searchExpression)).toEqual(["2", "4"]);
  });

  test("evaluates the deeply nested example from the query language discussion", () => {
    const searchExpression = SearchExpression.and([
      createLeaf("small"),
      SearchExpression.or([
        createLeaf("sweet"),
        SearchExpression.and([
          createLeaf("big"),
          SearchExpression.or([createLeaf("red"), createLeaf("green")])
        ])
      ])
    ]);

    expect(evaluateIds(items, searchExpression)).toEqual(["1", "5"]);
  });

  test("mixes negation into a nested tree", () => {
    const searchExpression = SearchExpression.and([
      SearchExpression.or([createLeaf("red"), createLeaf("green")]),
      SearchExpression.not(createLeaf("sweet"))
    ]);

    expect(evaluateIds(items, searchExpression)).toEqual(["2", "4"]);
  });

  test("matches an AND wrapping one OR group like the bare group", () => {
    const groupSearchExpression = SearchExpression.or([createLeaf("red"), createLeaf("blue")]);

    expect(evaluateIds(items, SearchExpression.and([groupSearchExpression]))).toEqual(evaluateIds(items, groupSearchExpression));
    expect(evaluateIds(items, SearchExpression.and([groupSearchExpression]))).toEqual(["1", "2", "5"]);
  });

  test("matches an AND wrapping one term like the bare term", () => {
    expect(evaluateIds(items, SearchExpression.and([createLeaf("sweet")]))).toEqual(["1", "3", "5"]);
  });

  test("keeps a short-circuited posting unchanged by a later intersection", () => {
    const bitEvaluator = createEvaluator(items);
    const wrappedSearchExpression = SearchExpression.and([createLeaf("sweet")]);
    const intersectedSearchExpression = SearchExpression.and([createLeaf("sweet"), createLeaf("small")]);

    expect(bitEvaluator.evaluate(wrappedSearchExpression).map(item => item.id).sort()).toEqual(["1", "3", "5"]);
    expect(bitEvaluator.evaluate(intersectedSearchExpression).map(item => item.id).sort()).toEqual(["1", "5"]);
    expect(bitEvaluator.evaluate(wrappedSearchExpression).map(item => item.id).sort()).toEqual(["1", "3", "5"]);
  });

  test("still subtracts a negated sibling from a single-positive AND", () => {
    expect(evaluateIds(items, SearchExpression.and([createLeaf("sweet"), createLeaf("-small")]))).toEqual(["3"]);
  });

  test("resolves a prefix wildcard leaf", () => {
    const items = [createItem("1", "apple"), createItem("2", "banana"), createItem("3", "cherry")];

    expect(evaluateIds(items, createLeaf("*a*"))).toEqual(["1", "2"]);
  });

  test("resolves a metric leaf inside a nested tree", () => {
    const items = [createItem("aa", "x"), createItem("bbbb", "x"), createItem("cccccc", "y")];
    const searchExpression = SearchExpression.and([
      createLeaf("id:>3"),
      SearchExpression.or([createLeaf("x"), createLeaf("y")])
    ]);

    expect(evaluateIds(items, searchExpression)).toEqual(["bbbb", "cccccc"]);
  });
});
