import { ALL_ITEM_NAMES, ALL_TAGS, ENGINE, Fruit, INDEX, ITEMS } from "./search_test_utils";
import { describe, expect, test } from "vitest";
import { SearchQuery } from "../lib/search/query/search_query";

function testSearchEngine(searchQuery: string, expectedNames: string[]): void {
  expect(ENGINE.search(new SearchQuery<Fruit>(searchQuery), ITEMS).map(item => item.name).sort()).toEqual(expectedNames.slice().sort());
}

function testSearch(rawQuery: string, expectedNames: string[]): void {
  const searchQuery = new SearchQuery<Fruit>(rawQuery);
  const expected = expectedNames.slice().sort();

  expect(ENGINE.search(searchQuery, ITEMS).map(item => item.name).sort()).toEqual(expected);
  expect(searchQuery.apply(ITEMS).map(item => item.name).sort()).toEqual(expected);
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
    testSearch("", ALL_ITEM_NAMES);
    testSearch(" ", ALL_ITEM_NAMES);
    testSearch(" \n\t", ALL_ITEM_NAMES);
  });

  test("all", () => {
    testSearch("*", ALL_ITEM_NAMES);
    testSearch("**", ALL_ITEM_NAMES);
  });

  test("names", () => {
    for (const item of ITEMS) {
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
    testSearch("-12345", ALL_ITEM_NAMES);

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
    const orAllQuery = `( ${Array.from(ALL_TAGS).join(" ~ ")} )`;
    const andAllQuery = `${Array.from(ALL_TAGS).join(" ")}`;

    testSearch(orAllQuery, ALL_ITEM_NAMES);
    testSearch(andAllQuery, []);

    for (const tag of ALL_TAGS) {
      testSearch(tag, ITEMS.filter(item => item.tags.has(tag)).map(item => item.name));
      testSearch(`-${tag}`, ITEMS.filter(item => !item.tags.has(tag)).map(item => item.name));
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

    ITEMS.push(item);
    INDEX.addDoc(item);
    testSearchEngine("foo", ["foo"]);
    INDEX.removeDoc(item);
    testSearchEngine("foo", []);
    INDEX.addDoc(item);
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
