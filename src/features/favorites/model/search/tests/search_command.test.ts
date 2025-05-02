import {ALL_ITEM_NAMES, ALL_TAGS, Fruit, INDEX, ITEMS} from "./test_utils";
import {describe, expect, test} from "vitest";
import {SearchCommand} from "../search_command/search_command";

function testGetSearchResults(searchQuery: string, expectedNames: string[]): void {
  expect(INDEX.getSearchResultsUsingIndex(searchQuery, ITEMS).map(item => item.name).sort()).toEqual(expectedNames.slice().sort());
  expect(new SearchCommand<Fruit>(searchQuery).getSearchResults(ITEMS).map(item => item.name).sort()).toEqual(expectedNames.slice().sort());
}

describe("create", () => {
  test("order", () => {
    expect(new SearchCommand("apple ( banana ~ cherry )"))
      .toStrictEqual(new SearchCommand("( banana ~ cherry ) apple"));
  });

  test("duplicates in or groups", () => {
    expect(new SearchCommand("apple ( banana ~ cherry )"))
      .toStrictEqual(new SearchCommand("( banana ~ cherry ~ cherry ) apple"));
  });

  test("sort or groups by length", () => {
    const searchCommand1 = new SearchCommand("apple ( banana ~ cherry ~ pear ) ( grape ~ orange )");
    const searchCommand2 = new SearchCommand("apple ( grape ~ orange ) ( banana ~ cherry ~ pear )");
    const searchCommand3 = new SearchCommand("apple ( grape ~ orange ) ( banana ~ cherry )");
    const searchCommand4 = new SearchCommand("apple  ( banana ~ cherry ) ( grape ~ orange )");

    expect(searchCommand1).toStrictEqual(searchCommand2);
    expect(searchCommand3).not.toStrictEqual(searchCommand4);
  });

  test("simplify or groups of length 1", () => {
    expect(new SearchCommand("-apple ( banana )")).toStrictEqual(new SearchCommand("banana -apple"));
    expect(new SearchCommand("-apple ( banana* ) ( cherry )")).toStrictEqual(new SearchCommand("cherry -apple banana*"));
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

describe("shouldExpand", () => {
  test("all cases", () => {
    // expect(new SearchCommand("apple ( banana ~ cherry )").shouldExpand).toBe(true);
    // expect(new SearchCommand("-apple ( banana ~ cherry )").shouldExpand).toBe(true);
    // expect(new SearchCommand("( banana ~ cherry )").shouldExpand).toBe(true);
    // expect(new SearchCommand("app* ( banana ~ cherry )").shouldExpand).toBe(true);
    // expect(new SearchCommand("( banana ~ cherry )").shouldExpand).toBe(true);
    // expect(new SearchCommand("apple ( banana ~ cherry ) ( grape ~ orange ) ( kiwi ~ mango )").shouldExpand).toBe(true);
    // expect(new SearchCommand("apple *pple* ( banana ~ che* ~ *ap* ) -red").shouldExpand).toBe(false);
  });
});
