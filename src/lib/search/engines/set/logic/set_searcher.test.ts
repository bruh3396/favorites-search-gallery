import { Fruit, FruitName, fruitDocs, index } from "@/lib/search/testing/fruit_corpus";
import { describe, expect, test } from "vitest";
import { DocResolver } from "@/lib/search/engines/set/resolution/doc_resolver";
import { MetricIndex } from "@/lib/search/engines/set/indexes/metric_index";
import { PositionIndex } from "@/lib/search/engines/set/indexes/position_index";
import { RelativeMetricIndex } from "@/lib/search/engines/set/indexes/relative_metric_index";
import { SetSearcher } from "@/lib/search/engines/set/logic/set_searcher";
import { WildcardDocResolver } from "@/lib/search/engines/set/resolution/wildcard_doc_resolver";
import { parseSearchQuery } from "@/lib/search/parsers/search_term_group_parser";

const positionIndex = new PositionIndex<Fruit>();

positionIndex.build(fruitDocs);
const wildcardResolver = new WildcardDocResolver<Fruit>(index);

wildcardResolver.index(index.indexedTerms());
const searcher = new SetSearcher<Fruit>(index, new DocResolver<Fruit>(index, new MetricIndex<Fruit>([], () => 0), new RelativeMetricIndex<Fruit>([], () => 0), positionIndex, wildcardResolver));

function assertMatches(query: string, expectedNames: FruitName[]): void {
  const expected = expectedNames.slice().sort();
  const actual = searcher.search(parseSearchQuery(query), fruitDocs).map(item => item.name).sort();

  expect(actual, query).toEqual(expected);
}

describe("SetSearcher", () => {
  test("empty query returns every doc", () => {
    assertMatches("", fruitDocs.map(doc => doc.name));
  });

  test("a single exact term", () => {
    assertMatches("mango", ["mango"]);
    assertMatches("sweet", ["cherry", "grape", "mango", "blueberry", "pear", "strawberry"]);
  });

  test("required terms intersect", () => {
    assertMatches("sweet juicy", ["grape", "mango", "pear", "strawberry"]);
    assertMatches("red sweet", ["cherry", "strawberry"]);
  });

  test("a negated term excludes matches", () => {
    assertMatches("sweet -red", ["grape", "mango", "blueberry", "pear"]);
  });

  test("an or group unions its terms", () => {
    assertMatches("( red ~ yellow )", ["apple", "banana", "cherry", "strawberry"]);
  });

  test("required terms narrow an or group", () => {
    assertMatches("sweet ( red ~ green )", ["cherry", "grape", "pear", "strawberry"]);
  });

  test("a mixed or group matches positives or non-negated", () => {
    assertMatches("juicy ( red ~ -antioxidants )", ["mango", "orange", "pear", "strawberry"]);
  });

  test("an unknown term matches nothing", () => {
    assertMatches("dragonfruit", []);
    assertMatches("sweet dragonfruit", []);
  });

  test("only negated terms", () => {
    assertMatches("-red", ["banana", "grape", "kiwi", "mango", "blueberry", "orange", "pear"]);
  });

  test("only or groups", () => {
    assertMatches("( sweet ~ tart ) ( juicy ~ small )", ["blueberry", "cherry", "grape", "mango", "kiwi", "pear", "strawberry"]);
  });

  test("a wildcard term resolves to the union of its matching terms' docs", () => {
    assertMatches("smooth*", ["banana", "kiwi", "mango", "strawberry"]);
    assertMatches("antioxidant*", ["apple", "blueberry", "cherry", "grape", "strawberry"]);
  });

  test("a negated wildcard excludes every doc it matches", () => {
    assertMatches("sweet -smooth*", ["blueberry", "cherry", "grape", "pear"]);
  });

  test("a wildcard inside an or group unions with its siblings", () => {
    assertMatches("( vitamin-a ~ trop* )", ["kiwi", "mango"]);
  });

  test("a wildcard matching nothing yields no matches", () => {
    assertMatches("zzz*", []);
    assertMatches("sweet zzz*", []);
  });
});
