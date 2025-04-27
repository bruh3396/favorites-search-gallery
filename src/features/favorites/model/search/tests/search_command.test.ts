import {describe, expect, test} from "vitest";
import {SearchCommand} from "../search_command";
import {Searchable} from "../../types/types";

const ITEMS: (Searchable & { name: string })[] = [
  {name: "apple", tags: new Set(["apple", "red", "sour", "fiber", "green", "crunchy", "snack", "antioxidants", "low-fat_(dairy)"])},
  {name: "banana", tags: new Set(["banana", "yellow", "sour", "fiber", "100cal", "green", "potassium", "smooth", "breakfast"])},
  {name: "cherry", tags: new Set(["cherry", "red", "sweet", "fiber", "antioxidants", "tart", "small", "snack", "dessert"])},
  {name: "grape", tags: new Set(["grape", "purple", "sweet", "small", "green", "snack", "juicy", "antioxidants", "seedless"])},
  {name: "kiwi", tags: new Set(["kiwi", "green", "tart", "fiber", "vitamin-c", "fuzzy", "tropical", "small", "smoothie"])},
  {name: "mango", tags: new Set(["mango", "tropical", "sweet", "juicy", "fiber", "smoothie", "dessert", "vitamin-a"])},
  {name: "blueberry", tags: new Set(["blueberry", "blue", "small", "antioxidant", "sweet", "berry", "snack", "baking", "fiber"])},
  {name: "orange", tags: new Set(["orange", "citrus", "vitamin-c", "juicy", "fiber", "breakfast", "peelable", "snack"])},
  {name: "pear", tags: new Set(["pear", "green", "grainy", "fiber", "sweet", "soft", "juicy", "vitamin-c", "lunch"])},
  {name: "strawberry", tags: new Set(["strawberry", "red", "sweet", "berry", "juicy", "dessert", "vitamin-c", "smoothie", "antioxidants"])}
];
const ALL_ITEM_NAMES = ITEMS.map(item => item.name);

const ALL_TAGS = new Set(ITEMS.flatMap(item => Array.from(item.tags)));

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
  function testGetSearchResults(searchQuery: string, expectedNames: string[]): void {
    const search = new SearchCommand(searchQuery);
    const results = search.getSearchResults(ITEMS);
    const resultNames = results.map(item => item.name);

    expect(resultNames.sort()).toEqual(expectedNames.sort());
  }

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
  });
});
