import { Fruit, allItemNames, allTags, engine, fruitItems, index } from "./search_test_utils";
import { describe, expect, test } from "vitest";
import { SearchQuery } from "../lib/search/query/search_query";

function testSearchEngine(searchQuery: string, expectedNames: string[]): void {
  expect(engine.search(new SearchQuery<Fruit>(searchQuery), fruitItems).map(item => item.name).sort()).toEqual(expectedNames.slice().sort());
}

function testSearch(rawQuery: string, expectedNames: string[]): void {
  const searchQuery = new SearchQuery<Fruit>(rawQuery);
  const expected = expectedNames.slice().sort();

  expect(engine.search(searchQuery, fruitItems).map(item => item.name).sort()).toEqual(expected);
  expect(searchQuery.apply(fruitItems).map(item => item.name).sort()).toEqual(expected);
}

function testSearchQueriesAreEqual(searchQuery1: string, searchQuery2: string): void {
  const query1 = new SearchQuery<Fruit>(searchQuery1);
  const query2 = new SearchQuery<Fruit>(searchQuery2);

  expect(query1.orGroups).toStrictEqual(query2.orGroups);
  expect(query1.andTags).toStrictEqual(query2.andTags);
  expect(query1.metadata).toStrictEqual(query2.metadata);
}

function testSearchQueriesAreNotEqual(searchQuery1: string, searchQuery2: string): void {
  const query1 = new SearchQuery<Fruit>(searchQuery1);
  const query2 = new SearchQuery<Fruit>(searchQuery2);

  const equal = JSON.stringify({ orGroups: query1.orGroups, andTags: query1.andTags, details: query1.metadata }) ===
    JSON.stringify({ orGroups: query2.orGroups, andTags: query2.andTags, details: query2.metadata });

  expect(equal).toBe(false);
}

describe("create", () => {
  test("order", () => {
    testSearchQueriesAreEqual("apple ( banana ~ cherry )", "( banana ~ cherry ) apple");
  });

  test("duplicates in or groups", () => {
    testSearchQueriesAreEqual("apple ( banana ~ cherry )", "( banana ~ cherry ~ cherry ) apple");
  });

  test("sort or groups by length", () => {
    testSearchQueriesAreEqual("apple ( banana ~ cherry ~ pear ) ( grape ~ orange )", "apple ( grape ~ orange ) ( banana ~ cherry ~ pear )");
    testSearchQueriesAreNotEqual("apple ( grape ~ orange ) ( banana ~ cherry )", "apple  ( banana ~ cherry ) ( grape ~ orange )");
  });

  test("simplify or groups of length 1", () => {
    testSearchQueriesAreEqual("-apple ( banana )", "banana -apple");
    testSearchQueriesAreEqual("-apple ( banana* ) ( cherry )", "cherry -apple banana*");
  });

  test("equal", () => {
    testSearchQueriesAreEqual("apple", "apple");
    testSearchQueriesAreEqual("apple", "apple   ");
    testSearchQueriesAreEqual("  apple", "apple   ");
    testSearchQueriesAreEqual("", "");
  });

  test("not equal", () => {
    testSearchQueriesAreNotEqual("apple", "banana");
    testSearchQueriesAreNotEqual("apple sweet", "apple");
    testSearchQueriesAreNotEqual("( apple ~ banana )", "( apple ~ cherry )");
    testSearchQueriesAreNotEqual("apple -sweet", "apple sweet");
    testSearchQueriesAreNotEqual("app*", "apple");
  });
});

describe("filter", () => {
  test("empty", () => {
    testSearch("", allItemNames);
    testSearch(" ", allItemNames);
    testSearch(" \n\t", allItemNames);
  });

  test("all", () => {
    testSearch("*", allItemNames);
    testSearch("**", allItemNames);
  });

  test("names", () => {
    for (const item of fruitItems) {
      testSearch(item.name, [item.name]);
    }
  });

  test("and", () => {
    testSearch("low-fat_(dairy)", ["apple"]);

    testSearch("red", ["apple", "cherry", "strawberry"]);
    testSearch("red sweet", ["cherry", "strawberry"]);
    testSearch("red -sweet", ["apple"]);
    testSearch("red apple", ["apple"]);
    testSearch("red banana", []);

    testSearch("12345", []);
    testSearch("-12345", allItemNames);

  });

  test("or", () => {
    testSearch("( red ~ blue )", ["apple", "cherry", "strawberry", "blueberry"]);
    testSearch("( red ~ blue ) ( apple ~ cherry )", ["apple", "cherry"]);
  });

  test("wildcard", () => {
    testSearch("ch*", ["cherry"]);
    testSearch("r*", ["apple", "cherry", "strawberry"]);
    testSearch("*ch", ["pear"]);
    testSearch("-*ch -ch* *ch*", ["apple"]);
    testSearch("*ch*", ["apple", "cherry", "pear"]);
  });

  test("mixed", () => {
    testSearch("( red ~ blue ) sweet", ["cherry", "strawberry", "blueberry"]);
    testSearch("( red ~ blue ) -*we*t", ["apple"]);
    testSearch("( red ~ blue ) ( apple ~ ch*y )", ["apple", "cherry"]);
    testSearch("( red ~ blue ) ( a* ~ cherry ) -sweet", ["apple"]);
    testSearch("( r* ~ blue ) ( apple ~ cherry ) -sweet -red", []);
  });

  test("invalid", () => {
    testSearch("( ~ )", []);
    testSearch("( )", []);
    testSearch("()", []);
    testSearch("(", []);
    testSearch(")", []);
    testSearch("-", []);
    testSearch(")-", []);
    testSearch(")) apple", []);
    testSearch(")) *", []);
    testSearch("(apple )", []);
    testSearch("( apple)", []);
    testSearch("( apple ~banana )", []);
    testSearch("( apple~banana )", []);
    testSearch("( apple~ banana )", []);
    testSearch("( apple ~ banana)", []);
    testSearch("apple )", []);
    testSearch("apple (", []);
  });

  test("all tags", () => {
    const orAllQuery = `( ${Array.from(allTags).join(" ~ ")} )`;
    const andAllQuery = `${Array.from(allTags).join(" ")}`;

    testSearch(orAllQuery, allItemNames);
    testSearch(andAllQuery, []);

    for (const tag of allTags) {
      testSearch(tag, fruitItems.filter(item => item.tags.has(tag)).map(item => item.name));
      testSearch(`-${tag}`, fruitItems.filter(item => !item.tags.has(tag)).map(item => item.name));
    }
  });

  test("logical", () => {
    testSearch("red -red", []);
    testSearch("red -r*", []);
    testSearch("red -*", []);
    testSearch("red -*red*", []);
    testSearch("red -red*", []);
    testSearch("red -*red", []);
  });
});

describe("updateIndex", () => {
  test("remove item", () => {
    const item = {name: "foo", tags: new Set<string>(["green", "purple", "sour", "sweet", "foo"])};

    fruitItems.push(item);
    index.addDoc(item);
    testSearchEngine("foo", ["foo"]);
    index.removeDoc(item);
    testSearchEngine("foo", []);
    index.addDoc(item);
    testSearchEngine("foo pur*", ["foo"]);
  });
});

describe("details", () => {
  test("hasMetadataTag", () => {
    expect(new SearchQuery("( apple ~ banana ) sweet").metadata.hasMetadataTag).toBe(false);
    expect(new SearchQuery("score:>50 sweet").metadata.hasMetadataTag).toBe(true);
    expect(new SearchQuery("( score:>50 ~ apple ) sweet").metadata.hasMetadataTag).toBe(true);
  });

  test("hasOrGroup", () => {
    expect(new SearchQuery("apple sweet").metadata.hasOrGroup).toBe(false);
    expect(new SearchQuery("( apple ~ banana ) sweet").metadata.hasOrGroup).toBe(true);
    expect(new SearchQuery("( apple ) sweet").metadata.hasOrGroup).toBe(false);
  });

  test("hasWildcardTag", () => {
    expect(new SearchQuery("apple sweet").metadata.hasWildcardTag).toBe(false);
    expect(new SearchQuery("app* sweet").metadata.hasWildcardTag).toBe(true);
    expect(new SearchQuery("( app* ~ banana ) sweet").metadata.hasWildcardTag).toBe(true);
    expect(new SearchQuery("-app* sweet").metadata.hasWildcardTag).toBe(true);
  });

  test("hasNormalTag", () => {
    expect(new SearchQuery("").metadata.hasPositiveAndTag).toBe(false);
    expect(new SearchQuery("app*").metadata.hasPositiveAndTag).toBe(false);
    expect(new SearchQuery("score:>50").metadata.hasPositiveAndTag).toBe(false);
    expect(new SearchQuery("-apple").metadata.hasPositiveAndTag).toBe(false);
    expect(new SearchQuery("( apple ~ banana )").metadata.hasPositiveAndTag).toBe(false);
    expect(new SearchQuery("( app* ~ banana )").metadata.hasPositiveAndTag).toBe(false);
    expect(new SearchQuery("apple").metadata.hasPositiveAndTag).toBe(true);
    expect(new SearchQuery("apple sweet").metadata.hasPositiveAndTag).toBe(true);
    expect(new SearchQuery("( apple ) sweet").metadata.hasPositiveAndTag).toBe(true);
  });
});
