import { Fruit, fruitDocs, index, searcher } from "@/lib/search/fixtures/fruit_search_fixture";
import { describe, expect, test } from "vitest";

function testSearcher(searchQuery: string, expectedNames: string[]): void {
  const expected = expectedNames.slice().sort();
  const actual = searcher.search(searchQuery, fruitDocs).map(item => item.name).sort();

  expect(actual, searchQuery).toEqual(expected);
}

function expectIndexed(term: string, indexed: boolean): void {
  expect(index.indexedTerms().includes(term)).toBe(indexed);
}

describe("index", () => {
  test("removeDoc", () => {
    const item: Fruit = {name: "pineapple", tags: new Set<string>(["yellow", "spiky", "sour", "sweet", "unique_tag"])};
    const matchingSearch = "yellow spiky -red";

    fruitDocs.push(item);

    expectIndexed("unique_tag", false);
    testSearcher(matchingSearch, []);

    index.addDoc(item);
    expectIndexed("unique_tag", true);
    testSearcher(matchingSearch, ["pineapple"]);

    index.removeDoc(item);
    expectIndexed("unique_tag", false);
    testSearcher(matchingSearch, []);

    index.addDoc(item);
    testSearcher(matchingSearch, ["pineapple"]);
    expectIndexed("unique_tag", true);
  });
});
