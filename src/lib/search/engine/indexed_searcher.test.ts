import { FruitName, fruitDocs, index } from "@/lib/search/testing/fruit_corpus";
import { describe, expect, test } from "vitest";
import { IndexedSearcher } from "@/lib/search/engine/indexed_searcher";
import { IndexedWildcardResolver } from "@/lib/search/engine/wildcard/resolver";
import { WildcardExpander } from "@/lib/search/engine/wildcard/expander";
import { searchCases } from "@/lib/search/testing/search_cases";

const expander = new WildcardExpander(new IndexedWildcardResolver(index.indexedTerms()));
const searcher = new IndexedSearcher(index, expander);

function testQuery(query: string, expectedNames: FruitName[]): void {
  const expected = expectedNames.slice().sort();
  const actual = searcher.search(query, fruitDocs).map(item => item.name).sort();

  expect(actual, query).toEqual(expected);
}

describe("IndexedSearcher", () => {
  for (const group of searchCases) {
    test(group.name, () => {
      group.run(testQuery);
    });
  }
});
