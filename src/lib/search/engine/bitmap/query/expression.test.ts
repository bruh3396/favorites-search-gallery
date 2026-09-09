import { ExpressionContext, SearchExpression } from "@/lib/search/engine/bitmap/query/expression";
import { describe, expect, test } from "vitest";
import { BitmapIndex } from "@/lib/search/engine/bitmap/indexes/index";
import { DensePosting } from "@/lib/search/engine/bitmap/bits/posting";
import { MetricBitmapIndex } from "@/lib/search/engine/bitmap/indexes/metric_index";
import { Searchable } from "@/types/search";
import { WildcardPostingResolver } from "@/lib/search/engine/bitmap/wildcard/posting_resolver";
import { parseSearchTerm } from "@/lib/search/query/parsers/search_term_parser";

interface Item extends Searchable { id: string }

function item(id: string, ...tags: string[]): Item {
  return { id, tags: new Set(tags) };
}

function contextFor(items: Item[]): ExpressionContext<Item> {
  const bitmapIndex = new BitmapIndex<Item>(doc => doc.tags);

  bitmapIndex.build(items);
  const metricIndex = new MetricBitmapIndex<Item>(doc => doc.id.length);

  metricIndex.build(bitmapIndex.width, bitmapIndex.positionalDocs());
  const wildcardResolver = new WildcardPostingResolver(
    postings => new DensePosting(bitmapIndex.unionOfPostings(postings)),
    term => bitmapIndex.postingForTerm(term)
  );

  wildcardResolver.index(bitmapIndex.indexedTerms());
  return { bitmapIndex, metricIndex, wildcardResolver };
}

function leaf(term: string): SearchExpression {
  return SearchExpression.term(parseSearchTerm(term));
}

function idsFor(items: Item[], expression: SearchExpression): string[] {
  return expression.evaluate(contextFor(items)).map(doc => doc.id).sort();
}

const corpus: Item[] = [
  item("1", "red", "sweet", "small"),
  item("2", "red", "sour", "big"),
  item("3", "green", "sweet", "big"),
  item("4", "green", "sour", "small"),
  item("5", "blue", "sweet", "small")
];

describe("SearchExpression leaves", () => {
  test("a lone positive term matches the docs carrying it", () => {
    expect(idsFor(corpus, leaf("sweet"))).toEqual(["1", "3", "5"]);
  });

  test("a term absent from the index matches nothing", () => {
    expect(idsFor(corpus, leaf("nonexistent"))).toEqual([]);
  });

  test("a negated term matches every doc without it", () => {
    expect(idsFor(corpus, leaf("-sweet"))).toEqual(["2", "4"]);
  });
});

describe("SearchExpression AND", () => {
  test("intersects its children", () => {
    expect(idsFor(corpus, SearchExpression.and([leaf("red"), leaf("sweet")]))).toEqual(["1"]);
  });

  test("is empty when children never co-occur", () => {
    expect(idsFor(corpus, SearchExpression.and([leaf("red"), leaf("green")]))).toEqual([]);
  });

  test("an empty AND matches the whole corpus", () => {
    expect(idsFor(corpus, SearchExpression.and([]))).toEqual(["1", "2", "3", "4", "5"]);
  });

  test("folds a negated child as set subtraction", () => {
    expect(idsFor(corpus, SearchExpression.and([leaf("sweet"), leaf("-small")]))).toEqual(["3"]);
  });
});

describe("SearchExpression OR", () => {
  test("unions its children", () => {
    expect(idsFor(corpus, SearchExpression.or([leaf("red"), leaf("blue")]))).toEqual(["1", "2", "5"]);
  });

  test("an empty OR matches nothing", () => {
    expect(idsFor(corpus, SearchExpression.or([]))).toEqual([]);
  });

  test("ignores a child that matches nothing", () => {
    expect(idsFor(corpus, SearchExpression.or([leaf("blue"), leaf("nonexistent")]))).toEqual(["5"]);
  });
});

describe("SearchExpression NOT", () => {
  test("complements a subtree", () => {
    expect(idsFor(corpus, SearchExpression.not(leaf("sweet")))).toEqual(["2", "4"]);
  });

  test("double negation is identity", () => {
    expect(idsFor(corpus, SearchExpression.not(SearchExpression.not(leaf("sweet"))))).toEqual(["1", "3", "5"]);
  });

  test("negating an OR is the complement of the union", () => {
    expect(idsFor(corpus, SearchExpression.not(SearchExpression.or([leaf("red"), leaf("green")])))).toEqual(["5"]);
  });
});

describe("SearchExpression arbitrary nesting", () => {
  test("evaluates an OR of ANDs without cartesian expansion", () => {
    const expression = SearchExpression.or([
      SearchExpression.and([leaf("red"), leaf("big")]),
      SearchExpression.and([leaf("green"), leaf("small")])
    ]);

    expect(idsFor(corpus, expression)).toEqual(["2", "4"]);
  });

  test("evaluates the deeply nested example from the query language discussion", () => {
    const expression = SearchExpression.and([
      leaf("small"),
      SearchExpression.or([
        leaf("sweet"),
        SearchExpression.and([
          leaf("big"),
          SearchExpression.or([leaf("red"), leaf("green")])
        ])
      ])
    ]);

    expect(idsFor(corpus, expression)).toEqual(["1", "5"]);
  });

  test("mixes negation into a nested tree", () => {
    const expression = SearchExpression.and([
      SearchExpression.or([leaf("red"), leaf("green")]),
      SearchExpression.not(leaf("sweet"))
    ]);

    expect(idsFor(corpus, expression)).toEqual(["2", "4"]);
  });
});

describe("SearchExpression wildcard and metric leaves", () => {
  test("resolves a prefix wildcard leaf", () => {
    const items = [item("1", "cat"), item("2", "car"), item("3", "dog")];

    expect(idsFor(items, leaf("ca*"))).toEqual(["1", "2"]);
  });

  test("resolves a metric leaf inside a nested tree", () => {
    const items = [item("aa", "x"), item("bbbb", "x"), item("cccccc", "y")];
    const expression = SearchExpression.and([
      leaf("id:>3"),
      SearchExpression.or([leaf("x"), leaf("y")])
    ]);

    expect(idsFor(items, expression)).toEqual(["bbbb", "cccccc"]);
  });
});
