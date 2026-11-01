import { Fruit, FruitName } from "@/core/domain/search/testing/fruit";
import { describe, expect, test } from "vitest";
import { DocResolver } from "@/core/domain/search/engines/set/resolution/doc_resolver";
import { FRUIT_CORPUS } from "@/core/domain/search/testing/fruit_corpus";
import { MetricIndex } from "@/core/domain/search/engines/set/indexes/metric_index";
import { PositionIndex } from "@/core/domain/search/engines/set/indexes/position_index";
import { RelativeMetricIndex } from "@/core/domain/search/engines/set/indexes/relative_metric_index";
import { SearchExpression } from "@/core/domain/search/expressions/search_expression";
import { SetEvaluator } from "@/core/domain/search/engines/set/logic/set_evaluator";
import { StringInterner } from "@/core/utils/string/string_interner";
import { WildcardDocResolver } from "@/core/domain/search/engines/set/resolution/wildcard_doc_resolver";
import { parseSearchExpression } from "@/core/domain/search/parsers/search_expression_parser";

const { fruits, invertedIndex } = FRUIT_CORPUS;
const positionIndex = new PositionIndex<Fruit>();

positionIndex.build(fruits);
const wildcardDocResolver = new WildcardDocResolver<Fruit>({ invertedIndex, stringInterner: new StringInterner() });

wildcardDocResolver.index(invertedIndex.indexedTerms());
const metricIndex = new MetricIndex<Fruit>([], () => 0);
const relativeMetricIndex = new RelativeMetricIndex<Fruit>([], () => 0);
const docResolver = new DocResolver<Fruit>({ invertedIndex, metricIndex, relativeMetricIndex, positionIndex, wildcardDocResolver });
const setEvaluator = new SetEvaluator<Fruit>(invertedIndex, docResolver);

function expectMatches(query: string, expectedFruitNames: FruitName[]): void {
  const actualFruitNames = setEvaluator.evaluate(parseSearchExpression(query), fruits).map(fruit => fruit.name).sort();

  expect(actualFruitNames, query).toEqual([...expectedFruitNames].sort());
}

describe("SetEvaluator", () => {
  test("returns every doc for an empty query", () => {
    expectMatches("", fruits.map(fruit => fruit.name));
  });

  test("matches a single exact term", () => {
    expectMatches("mango", ["mango"]);
    expectMatches("sweet", ["cherry", "grape", "mango", "blueberry", "pear", "strawberry"]);
  });

  test("intersects required terms", () => {
    expectMatches("sweet juicy", ["grape", "mango", "pear", "strawberry"]);
    expectMatches("red sweet", ["cherry", "strawberry"]);
  });

  test("excludes the matches of a negated term", () => {
    expectMatches("sweet -red", ["grape", "mango", "blueberry", "pear"]);
  });

  test("unions the terms of an or group", () => {
    expectMatches("( red ~ yellow )", ["apple", "banana", "cherry", "strawberry"]);
  });

  test("narrows an or group by required terms", () => {
    expectMatches("sweet ( red ~ green )", ["cherry", "grape", "pear", "strawberry"]);
  });

  test("matches a mixed or group's positives or what its negated terms leave out", () => {
    expectMatches("juicy ( red ~ -antioxidants )", ["mango", "orange", "pear", "strawberry"]);
  });

  test("matches nothing for an unknown term", () => {
    expectMatches("dragonfruit", []);
    expectMatches("sweet dragonfruit", []);
  });

  test("matches what a query of only negated terms leaves out", () => {
    expectMatches("-red", ["banana", "grape", "kiwi", "mango", "blueberry", "orange", "pear"]);
  });

  test("intersects a query of only or groups", () => {
    expectMatches("( sweet ~ tart ) ( juicy ~ small )", ["blueberry", "cherry", "grape", "mango", "kiwi", "pear", "strawberry"]);
  });

  test("resolves a wildcard term to the union of its matching terms' docs", () => {
    expectMatches("smooth*", ["banana", "kiwi", "mango", "strawberry"]);
    expectMatches("antioxidant*", ["apple", "blueberry", "cherry", "grape", "strawberry"]);
  });

  test("excludes every doc a negated wildcard matches", () => {
    expectMatches("sweet -smooth*", ["blueberry", "cherry", "grape", "pear"]);
  });

  test("unions a wildcard inside an or group with its siblings", () => {
    expectMatches("( vitamin-a ~ trop* )", ["kiwi", "mango"]);
  });

  test("matches nothing for a wildcard that matches no term", () => {
    expectMatches("zzz*", []);
    expectMatches("sweet zzz*", []);
  });

  test("matches every doc outside a negated root expression", () => {
    const actualFruitNames = setEvaluator.evaluate(SearchExpression.not(parseSearchExpression("red")), fruits).map(fruit => fruit.name).sort();

    expect(actualFruitNames).toEqual(["banana", "blueberry", "grape", "kiwi", "mango", "orange", "pear"]);
  });

  test("still excludes a negated root's matches when the candidate list dwarfs the index", () => {
    const unindexedFruits: Fruit[] = Array.from({ length: fruits.length * 3 }, () => ({ name: "apple", tags: new Set<string>(), getMetric: (): number => 0 }));
    const actualFruitNames = setEvaluator
      .evaluate(SearchExpression.not(parseSearchExpression("red")), [...fruits, ...unindexedFruits])
      .map(fruit => fruit.name)
      .sort();

    expect(actualFruitNames).toEqual(["banana", "blueberry", "grape", "kiwi", "mango", "orange", "pear"]);
  });
});
