import { ALL_ITEM_NAMES, ALL_TAGS, Fruit, INDEX, ITEMS } from "./search_test_utils";
import { describe, expect, test } from "vitest";
import { SearchQuery } from "../lib/search/query/search_query";

function testSearchUsingIndex(searchQuery: string, expectedNames: string[]): void {
  expect(INDEX.search(new SearchQuery<Fruit>(searchQuery), ITEMS).map(item => item.name).sort()).toEqual(expectedNames.slice().sort());
}

function testSearchQueryFilter(rawQuery: string, expectedNames: string[]): void {
  const searchQuery = new SearchQuery<Fruit>(rawQuery);

  expect(INDEX.search(searchQuery, ITEMS).map(item => item.name).sort()).toEqual(expectedNames.slice().sort());
  expect(searchQuery.filter(ITEMS).map(item => item.name).sort()).toEqual(expectedNames.slice().sort());
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
    testSearchQueryFilter("", ALL_ITEM_NAMES);
    testSearchQueryFilter(" ", ALL_ITEM_NAMES);
    testSearchQueryFilter(" \n\t", ALL_ITEM_NAMES);
  });

  test("all", () => {
    testSearchQueryFilter("*", ALL_ITEM_NAMES);
    testSearchQueryFilter("**", ALL_ITEM_NAMES);
  });

  test("names", () => {
    for (const item of ITEMS) {
      testSearchQueryFilter(item.name, [item.name]);
    }
  });

  test("and", () => {
    testSearchQueryFilter("low-fat_(dairy)", ["apple"]);

    testSearchQueryFilter("red", ["apple", "cherry", "strawberry"]);
    testSearchQueryFilter("red sweet", ["cherry", "strawberry"]);
    testSearchQueryFilter("red -sweet", ["apple"]);
    testSearchQueryFilter("red apple", ["apple"]);
    testSearchQueryFilter("red banana", []);

    testSearchQueryFilter("12345", []);
    testSearchQueryFilter("-12345", ALL_ITEM_NAMES);

  });

  test("or", () => {
    testSearchQueryFilter("( red ~ blue )", ["apple", "cherry", "strawberry", "blueberry"]);
    testSearchQueryFilter("( red ~ blue ) ( apple ~ cherry )", ["apple", "cherry"]);
  });

  test("wildcard", () => {
    testSearchQueryFilter("ch*", ["cherry"]);
    // testSearchQueryFilter("r*", ["apple", "cherry", "strawberry"]);
    // testSearchQueryFilter("*ch", ["pear"]);
    // testSearchQueryFilter("-*ch -ch* *ch*", ["apple"]);
    // testSearchQueryFilter("*ch*", ["apple", "cherry", "pear"]);
  });

  test("mixed", () => {
    testSearchQueryFilter("( red ~ blue ) sweet", ["cherry", "strawberry", "blueberry"]);
    testSearchQueryFilter("( red ~ blue ) -*we*t", ["apple"]);
    testSearchQueryFilter("( red ~ blue ) ( apple ~ ch*y )", ["apple", "cherry"]);
    testSearchQueryFilter("( red ~ blue ) ( a* ~ cherry ) -sweet", ["apple"]);
    testSearchQueryFilter("( r* ~ blue ) ( apple ~ cherry ) -sweet -red", []);
  });

  test("invalid", () => {
    testSearchQueryFilter("( ~ )", []);
    testSearchQueryFilter("( )", []);
    testSearchQueryFilter("()", []);
    testSearchQueryFilter("(", []);
    testSearchQueryFilter(")", []);
    testSearchQueryFilter("-", []);
    testSearchQueryFilter(")-", []);
    testSearchQueryFilter(")) apple", []);
    testSearchQueryFilter(")) *", []);
    testSearchQueryFilter("(apple )", []);
    testSearchQueryFilter("( apple)", []);
    testSearchQueryFilter("( apple ~banana )", []);
    testSearchQueryFilter("( apple~banana )", []);
    testSearchQueryFilter("( apple~ banana )", []);
    testSearchQueryFilter("( apple ~ banana)", []);
    testSearchQueryFilter("apple )", []);
    testSearchQueryFilter("apple (", []);
  });

  test("all tags", () => {
    const orAllQuery = `( ${Array.from(ALL_TAGS).join(" ~ ")} )`;
    const andAllQuery = `${Array.from(ALL_TAGS).join(" ")}`;

    testSearchQueryFilter(orAllQuery, ALL_ITEM_NAMES);
    testSearchQueryFilter(andAllQuery, []);

    for (const tag of ALL_TAGS) {
      testSearchQueryFilter(tag, ITEMS.filter(item => item.tags.has(tag)).map(item => item.name));
      testSearchQueryFilter(`-${tag}`, ITEMS.filter(item => !item.tags.has(tag)).map(item => item.name));
    }
  });

  test("logical", () => {
    testSearchQueryFilter("red -red", []);
    testSearchQueryFilter("red -r*", []);
    testSearchQueryFilter("red -*", []);
    testSearchQueryFilter("red -*red*", []);
    testSearchQueryFilter("red -red*", []);
    testSearchQueryFilter("red -*red", []);
  });
});

describe("updateIndex", () => {
  test("remove item", () => {
    const item = {name: "foo", tags: new Set<string>(["green", "purple", "sour", "sweet", "foo"])};

    ITEMS.push(item);
    INDEX.add(item);
    testSearchUsingIndex("foo", ["foo"]);
    INDEX.unlinkTags(item);
    testSearchUsingIndex("foo", []);
    INDEX.add(item);
    testSearchUsingIndex("foo pur*", ["foo"]);
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
