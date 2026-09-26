import { Fruit, FruitName, fruitDocs, index } from "@/lib/search/testing/fruit_corpus";
import { describe, expect, test } from "vitest";
import { DocResolver } from "@/lib/search/engines/set/resolution/doc_resolver";
import { MetricIndex } from "@/lib/search/engines/set/indexes/metric_index";
import { PositionIndex } from "@/lib/search/engines/set/indexes/position_index";
import { RelativeMetricIndex } from "@/lib/search/engines/set/indexes/relative_metric_index";
import { SearchExpression } from "@/lib/search/expression/search_expression";
import { SetEvaluator } from "@/lib/search/engines/set/logic/set_evaluator";
import { WildcardDocResolver } from "@/lib/search/engines/set/resolution/wildcard_doc_resolver";
import { parseSearchExpression } from "@/lib/search/parsers/search_expression_parser";

const positionIndex = new PositionIndex<Fruit>();

positionIndex.build(fruitDocs);
const wildcardResolver = new WildcardDocResolver<Fruit>(index);

wildcardResolver.index(index.indexedTerms());
const searcher = new SetEvaluator<Fruit>(index, new DocResolver<Fruit>(index, new MetricIndex<Fruit>([], () => 0), new RelativeMetricIndex<Fruit>([], () => 0), positionIndex, wildcardResolver));

function expectMatches(query: string, expectedNames: FruitName[]): void {
  const expected = expectedNames.slice().sort();
  const actual = searcher.evaluate(parseSearchExpression(query), fruitDocs).map(item => item.name).sort();

  expect(actual, query).toEqual(expected);
}

describe("SetEvaluator", () => {
  test("empty query returns every doc", () => {
    expectMatches("", fruitDocs.map(doc => doc.name));
  });

  test("a single exact term", () => {
    expectMatches("mango", ["mango"]);
    expectMatches("sweet", ["cherry", "grape", "mango", "blueberry", "pear", "strawberry"]);
  });

  test("required terms intersect", () => {
    expectMatches("sweet juicy", ["grape", "mango", "pear", "strawberry"]);
    expectMatches("red sweet", ["cherry", "strawberry"]);
  });

  test("a negated term excludes matches", () => {
    expectMatches("sweet -red", ["grape", "mango", "blueberry", "pear"]);
  });

  test("an or group unions its terms", () => {
    expectMatches("( red ~ yellow )", ["apple", "banana", "cherry", "strawberry"]);
  });

  test("required terms narrow an or group", () => {
    expectMatches("sweet ( red ~ green )", ["cherry", "grape", "pear", "strawberry"]);
  });

  test("a mixed or group matches positives or non-negated", () => {
    expectMatches("juicy ( red ~ -antioxidants )", ["mango", "orange", "pear", "strawberry"]);
  });

  test("an unknown term matches nothing", () => {
    expectMatches("dragonfruit", []);
    expectMatches("sweet dragonfruit", []);
  });

  test("only negated terms", () => {
    expectMatches("-red", ["banana", "grape", "kiwi", "mango", "blueberry", "orange", "pear"]);
  });

  test("only or groups", () => {
    expectMatches("( sweet ~ tart ) ( juicy ~ small )", ["blueberry", "cherry", "grape", "mango", "kiwi", "pear", "strawberry"]);
  });

  test("a wildcard term resolves to the union of its matching terms' docs", () => {
    expectMatches("smooth*", ["banana", "kiwi", "mango", "strawberry"]);
    expectMatches("antioxidant*", ["apple", "blueberry", "cherry", "grape", "strawberry"]);
  });

  test("a negated wildcard excludes every doc it matches", () => {
    expectMatches("sweet -smooth*", ["blueberry", "cherry", "grape", "pear"]);
  });

  test("a wildcard inside an or group unions with its siblings", () => {
    expectMatches("( vitamin-a ~ trop* )", ["kiwi", "mango"]);
  });

  test("a wildcard matching nothing yields no matches", () => {
    expectMatches("zzz*", []);
    expectMatches("sweet zzz*", []);
  });

  test("a negated root expression matches every doc outside it", () => {
    const actual = searcher.evaluate(SearchExpression.not(parseSearchExpression("red")), fruitDocs).map(item => item.name).sort();

    expect(actual).toEqual(["banana", "blueberry", "grape", "kiwi", "mango", "orange", "pear"]);
  });

  test("a negated root still excludes its matches when the candidate list dwarfs the index", () => {
    const unindexed: Fruit[] = Array.from({ length: fruitDocs.length * 3 }, () => ({ name: "apple", tags: new Set<string>(), getMetric: (): number => 0 }));
    const actual = searcher.evaluate(SearchExpression.not(parseSearchExpression("red")), [...fruitDocs, ...unindexed]).map(item => item.name).sort();

    expect(actual).toEqual(["banana", "blueberry", "grape", "kiwi", "mango", "orange", "pear"]);
  });
});
