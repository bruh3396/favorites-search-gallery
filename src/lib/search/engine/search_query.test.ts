import { Fruit, FruitName, fruitDocs } from "@/lib/search/testing/fruit_corpus";
import { describe, expect, test } from "vitest";
import { parseSearchQuery } from "@/lib/search/parsers/search_term_group_parser";
import { searchCases } from "@/lib/search/testing/search_cases";

function testQuery(query: string, expectedNames: FruitName[]): void {
  const expected = expectedNames.slice().sort();
  const actual = parseSearchQuery<Fruit>(query).filter(fruitDocs).map(item => item.name).sort();

  expect(actual, query).toEqual(expected);
}

describe("filter", () => {
  for (const searchCase of searchCases) {
    test(searchCase.name, () => {
      searchCase.run(testQuery);
    });
  }
});
