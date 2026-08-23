import { FruitName, fruitDocs, searchCases, searcher } from "@/lib/search/fruit_search_fixture";
import { describe, expect, test } from "vitest";

function testQuery(query: string, expectedNames: FruitName[]): void {
  const expected = expectedNames.slice().sort();
  const actual = searcher.search(query, fruitDocs).map(item => item.name).sort();

  expect(actual, query).toEqual(expected);
}

describe("search", () => {
  for (const group of searchCases) {
    test(group.name, () => {
      group.run(testQuery);
    });
  }
});
