import { ALL_ITEM_NAMES, ALL_TAGS, Fruit, INDEX, ITEMS } from "./search_test_utils";
import { describe, expect, test } from "vitest";
import { SearchCommand } from "../search_command/search_command";

function testGetSearchResultsFromIndex(searchQuery: string, expectedNames: string[]): void {
  expect(INDEX.getSearchResults(new SearchCommand<Fruit>(searchQuery), ITEMS).map(item => item.name).sort()).toEqual(expectedNames.slice().sort());
}

function testGetSearchResults(searchQuery: string, expectedNames: string[]): void {
  const searchCommand = new SearchCommand<Fruit>(searchQuery);

  expect(INDEX.getSearchResults(searchCommand, ITEMS).map(item => item.name).sort()).toEqual(expectedNames.slice().sort());
  expect(searchCommand.getSearchResults(ITEMS).map(item => item.name).sort()).toEqual(expectedNames.slice().sort());
}

function getSearchCommandWithoutQuery(searchQuery: string): SearchCommand<Fruit> {
  const searchCommand = new SearchCommand<Fruit>(searchQuery);

  searchCommand.query = "";
  return searchCommand;
}

function testSearchCommandsAreEqual(searchQuery1: string, searchQuery2: string): void {
  expect(getSearchCommandWithoutQuery(searchQuery1))
    .toStrictEqual(getSearchCommandWithoutQuery(searchQuery2));
}

function testSearchCommandsAreNotEqual(searchQuery1: string, searchQuery2: string): void {
  expect(getSearchCommandWithoutQuery(searchQuery1))
    .not.toStrictEqual(getSearchCommandWithoutQuery(searchQuery2));
}

describe("create", () => {
  test("order", () => {
    testSearchCommandsAreEqual("apple ( banana ~ cherry )", "( banana ~ cherry ) apple");
  });

  test("duplicates in or groups", () => {
    testSearchCommandsAreEqual("apple ( banana ~ cherry )", "( banana ~ cherry ~ cherry ) apple");
  });

  test("sort or groups by length", () => {
    testSearchCommandsAreEqual("apple ( banana ~ cherry ~ pear ) ( grape ~ orange )", "apple ( grape ~ orange ) ( banana ~ cherry ~ pear )");
    testSearchCommandsAreNotEqual("apple ( grape ~ orange ) ( banana ~ cherry )", "apple  ( banana ~ cherry ) ( grape ~ orange )");
  });

  test("simplify or groups of length 1", () => {
    testSearchCommandsAreEqual("-apple ( banana )", "banana -apple");
    testSearchCommandsAreEqual("-apple ( banana* ) ( cherry )", "cherry -apple banana*");
  });
});

describe("getSearchResults", () => {
  test("empty", () => {
    testGetSearchResults("", ALL_ITEM_NAMES);
    testGetSearchResults(" ", ALL_ITEM_NAMES);
    testGetSearchResults(" \n\t", ALL_ITEM_NAMES);
  });

  test("all", () => {
    testGetSearchResults("*", ALL_ITEM_NAMES);
    testGetSearchResults("**", ALL_ITEM_NAMES);
  });

  test("names", () => {
    for (const item of ITEMS) {
      testGetSearchResults(item.name, [item.name]);
    }
  });

  test("and", () => {
    testGetSearchResults("low-fat_(dairy)", ["apple"]);

    testGetSearchResults("red", ["apple", "cherry", "strawberry"]);
    testGetSearchResults("red sweet", ["cherry", "strawberry"]);
    testGetSearchResults("red -sweet", ["apple"]);
    testGetSearchResults("red apple", ["apple"]);
    testGetSearchResults("red banana", []);

    testGetSearchResults("12345", []);
    testGetSearchResults("-12345", ALL_ITEM_NAMES);

  });

  test("or", () => {
    testGetSearchResults("( red ~ blue )", ["apple", "cherry", "strawberry", "blueberry"]);
    testGetSearchResults("( red ~ blue ) ( apple ~ cherry )", ["apple", "cherry"]);
  });

  test("wildcard", () => {
    testGetSearchResults("ch*", ["cherry"]);
    testGetSearchResults("r*", ["apple", "cherry", "strawberry"]);
    testGetSearchResults("*ch", ["pear"]);
    testGetSearchResults("-*ch -ch* *ch*", ["apple"]);
    testGetSearchResults("*ch*", ["apple", "cherry", "pear"]);
  });

  test("mixed", () => {
    testGetSearchResults("( red ~ blue ) sweet", ["cherry", "strawberry", "blueberry"]);
    testGetSearchResults("( red ~ blue ) -*we*t", ["apple"]);
    testGetSearchResults("( red ~ blue ) ( apple ~ ch*y )", ["apple", "cherry"]);
    testGetSearchResults("( red ~ blue ) ( a* ~ cherry ) -sweet", ["apple"]);
    testGetSearchResults("( r* ~ blue ) ( apple ~ cherry ) -sweet -red", []);
  });

  test("invalid", () => {
    testGetSearchResults("( ~ )", []);
    testGetSearchResults("( )", []);
    testGetSearchResults("()", []);
    testGetSearchResults("(", []);
    testGetSearchResults(")", []);
    testGetSearchResults("-", []);
    testGetSearchResults(")-", []);
    testGetSearchResults(")) apple", []);
    testGetSearchResults(")) *", []);
    testGetSearchResults("(apple )", []);
    testGetSearchResults("( apple)", []);
    testGetSearchResults("( apple ~banana )", []);
    testGetSearchResults("( apple~banana )", []);
    testGetSearchResults("( apple~ banana )", []);
    testGetSearchResults("( apple ~ banana)", []);
    testGetSearchResults("apple )", []);
    testGetSearchResults("apple (", []);
  });

  test("all tags", () => {
    const orAllQuery = `( ${Array.from(ALL_TAGS).join(" ~ ")} )`;
    const andAllQuery = `${Array.from(ALL_TAGS).join(" ")}`;

    testGetSearchResults(orAllQuery, ALL_ITEM_NAMES);
    testGetSearchResults(andAllQuery, []);

    for (const tag of ALL_TAGS) {
      testGetSearchResults(tag, ITEMS.filter(item => item.tags.has(tag)).map(item => item.name));
      testGetSearchResults(`-${tag}`, ITEMS.filter(item => !item.tags.has(tag)).map(item => item.name));
    }
  });

  test("logical", () => {
    testGetSearchResults("red -red", []);
    testGetSearchResults("red -r*", []);
    testGetSearchResults("red -*", []);
    testGetSearchResults("red -*red*", []);
    testGetSearchResults("red -red*", []);
    testGetSearchResults("red -*red", []);
  });
});

describe("updateIndex", () => {
  test("remove item", () => {
    const item = {name: "foo", tags: new Set<string>(["green", "purple", "sour", "sweet", "foo"])};

    ITEMS.push(item);
    INDEX.add(item);
    testGetSearchResultsFromIndex("foo", ["foo"]);
    INDEX.remove(item);
    testGetSearchResultsFromIndex("foo", []);
    INDEX.add(item);
    testGetSearchResultsFromIndex("foo pur*", ["foo"]);
  });
});
