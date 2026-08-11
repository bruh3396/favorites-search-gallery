import { buildIdQuery, failureText, filterSnippets, normalizeName, sortByRecentlyUsed } from "@/features/favorites/features/snippets/utils";
import { describe, expect, test } from "vitest";
import { Snippet } from "@/features/favorites/features/snippets/types";

const snippet = (name: string, query: string, lastUsedAt: number = 0, createdAt: number = 0): Snippet => ({ name, query, lastUsedAt, createdAt });
const namesOf = (snippets: Snippet[]): string[] => snippets.map(entry => entry.name);

describe("buildIdQuery", () => {
  test("joins ids with tildes inside parentheses", () => {
    expect(buildIdQuery(["1", "2", "3"])).toBe("( 1 ~ 2 ~ 3 )");
  });

  test("wraps a single id", () => {
    expect(buildIdQuery(["42"])).toBe("( 42 )");
  });

  test("returns empty string when there are no ids", () => {
    expect(buildIdQuery([])).toBe("");
  });
});

describe("normalizeName", () => {
  test("lowercases", () => {
    expect(normalizeName("Fruits")).toBe("fruits");
  });

  test("replaces spaces with underscores", () => {
    expect(normalizeName("my fruits")).toBe("my_fruits");
  });

  test("collapses repeated whitespace before replacing", () => {
    expect(normalizeName("  my   fruits  ")).toBe("my_fruits");
  });

  test("leaves an already normalized name alone", () => {
    expect(normalizeName("my_fruits")).toBe("my_fruits");
  });
});

describe("sortByRecentlyUsed", () => {
  test("puts the most recently used first", () => {
    const snippets = [snippet("a", "1", 100), snippet("b", "2", 300), snippet("c", "3", 200)];

    expect(namesOf(sortByRecentlyUsed(snippets))).toEqual(["b", "c", "a"]);
  });

  test("falls back to newest created when unused", () => {
    const snippets = [snippet("a", "1", 0, 100), snippet("b", "2", 0, 300), snippet("c", "3", 0, 200)];

    expect(namesOf(sortByRecentlyUsed(snippets))).toEqual(["b", "c", "a"]);
  });

  test("ranks any used snippet above an unused one", () => {
    const snippets = [snippet("unused", "1", 0, 999), snippet("used", "2", 1, 0)];

    expect(namesOf(sortByRecentlyUsed(snippets))).toEqual(["used", "unused"]);
  });

  test("does not modify the given array", () => {
    const snippets = [snippet("a", "1", 100), snippet("b", "2", 300)];

    sortByRecentlyUsed(snippets);
    expect(namesOf(snippets)).toEqual(["a", "b"]);
  });

  test("handles an empty list", () => {
    expect(sortByRecentlyUsed([])).toEqual([]);
  });
});

describe("filterSnippets", () => {
  const snippets = [snippet("fruits", "( apple ~ banana )"), snippet("veg", "carrot"), snippet("boys", "male* solo")];

  test("returns everything when the text is empty", () => {
    expect(namesOf(filterSnippets(snippets, ""))).toEqual(["fruits", "veg", "boys"]);
  });

  test("returns everything when the text is only whitespace", () => {
    expect(namesOf(filterSnippets(snippets, "   "))).toEqual(["fruits", "veg", "boys"]);
  });

  test("matches on the name", () => {
    expect(namesOf(filterSnippets(snippets, "fru"))).toEqual(["fruits"]);
  });

  test("matches on the query", () => {
    expect(namesOf(filterSnippets(snippets, "carrot"))).toEqual(["veg"]);
  });

  test("ignores case", () => {
    expect(namesOf(filterSnippets(snippets, "APPLE"))).toEqual(["fruits"]);
  });

  test("trims the search text", () => {
    expect(namesOf(filterSnippets(snippets, "  veg  "))).toEqual(["veg"]);
  });

  test("returns every match", () => {
    expect(namesOf(filterSnippets([snippet("a", "apple"), snippet("apple", "b")], "apple"))).toEqual(["a", "apple"]);
  });

  test("ignores a leading slash", () => {
    expect(namesOf(filterSnippets(snippets, "/fru"))).toEqual(["fruits"]);
  });

  test("returns everything when the text is only slashes", () => {
    expect(namesOf(filterSnippets(snippets, "//"))).toEqual(["fruits", "veg", "boys"]);
  });

  test("returns nothing when nothing matches", () => {
    expect(filterSnippets(snippets, "zzz")).toEqual([]);
  });

  test("keeps the given order", () => {
    expect(namesOf(filterSnippets(snippets, "o"))).toEqual(["veg", "boys"]);
  });
});

describe("failureText", () => {
  test("explains an empty name", () => {
    expect(failureText("empty-name", "")).toBe("A snippet needs a name");
  });

  test("explains an empty query", () => {
    expect(failureText("empty-query", "fruits")).toBe("A snippet needs a query");
  });

  test("names the snippet that already exists", () => {
    expect(failureText("duplicate-name", "fruits")).toBe("A snippet named /fruits already exists");
  });

  test("explains a missing snippet", () => {
    expect(failureText("not-found", "fruits")).toBe("That snippet no longer exists");
  });
});
