import { Fruit, FruitName, fruitDocs, index } from "@/lib/search/testing/fruit_corpus";
import { describe, expect, test } from "vitest";
import { DocsResolver } from "@/lib/search/engine/docs_resolver";
import { InvertedIndexedSearcher } from "@/lib/search/engine/inverted_index_searcher";
import { MetricIndex } from "@/lib/collection/metric_index";
import { parseSearchQuery } from "@/lib/search/parsers/search_term_group_parser";

const searcher = new InvertedIndexedSearcher<Fruit>(new DocsResolver<Fruit>(index, new MetricIndex<Fruit>([], () => 0), () => 0));

function testQuery(query: string, expectedNames: FruitName[]): void {
  const expected = expectedNames.slice().sort();
  const actual = searcher.search(parseSearchQuery(query), fruitDocs).map(item => item.name).sort();

  expect(actual, query).toEqual(expected);
}

describe("InvertedIndexedSearcher", () => {
  test("empty query returns every doc", () => {
    testQuery("", fruitDocs.map(doc => doc.name));
  });

  test("a single exact term", () => {
    testQuery("mango", ["mango"]);
    testQuery("sweet", ["cherry", "grape", "mango", "blueberry", "pear", "strawberry"]);
  });

  test("required terms intersect", () => {
    testQuery("sweet juicy", ["grape", "mango", "pear", "strawberry"]);
    testQuery("red sweet", ["cherry", "strawberry"]);
  });

  test("a negated term excludes matches", () => {
    testQuery("sweet -red", ["grape", "mango", "blueberry", "pear"]);
  });

  test("an or group unions its terms", () => {
    testQuery("( red ~ yellow )", ["apple", "banana", "cherry", "strawberry"]);
  });

  test("required terms narrow an or group", () => {
    testQuery("sweet ( red ~ green )", ["cherry", "grape", "pear", "strawberry"]);
  });

  test("a mixed or group matches positives or non-negated", () => {
    testQuery("juicy ( red ~ -antioxidants )", ["mango", "orange", "pear", "strawberry"]);
  });

  test("an unknown term matches nothing", () => {
    testQuery("dragonfruit", []);
    testQuery("sweet dragonfruit", []);
  });
});
