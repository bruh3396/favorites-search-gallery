import * as SnippetListing from "@/features/favorites/features/snippets/model/listing";
import { describe, expect, test } from "vitest";
import { Snippet } from "@/features/favorites/features/snippets/types/types";
import { createSnippet } from "@/features/favorites/features/snippets/testing/snippets";

const namesOf = (snippets: Snippet[]): string[] => snippets.map(entry => entry.name);

describe("sortByNewest", () => {
  test("puts the most recently created first", () => {
    const snippets = [createSnippet("a", "1", 0, 100), createSnippet("b", "2", 0, 300), createSnippet("c", "3", 0, 200)];

    expect(namesOf(SnippetListing.sortByNewest(snippets))).toEqual(["b", "c", "a"]);
  });

  test("ignores when a snippet was last used", () => {
    const snippets = [createSnippet("older", "1", 999, 100), createSnippet("newer", "2", 0, 200)];

    expect(namesOf(SnippetListing.sortByNewest(snippets))).toEqual(["newer", "older"]);
  });

  test("does not modify the given array", () => {
    const snippets = [createSnippet("a", "1", 0, 100), createSnippet("b", "2", 0, 300)];

    SnippetListing.sortByNewest(snippets);
    expect(namesOf(snippets)).toEqual(["a", "b"]);
  });

  test("handles an empty list", () => {
    expect(SnippetListing.sortByNewest([])).toEqual([]);
  });
});

describe("filterSnippets", () => {
  const snippets = [createSnippet("fruits", "( apple ~ banana )"), createSnippet("veg", "carrot"), createSnippet("boys", "male* solo")];
  const namesFor = (text: string, source: Snippet[] = snippets): string[] => namesOf(SnippetListing.filterSnippets(source, text));

  test("returns everything when the text is empty", () => {
    expect(namesFor("")).toEqual(["fruits", "veg", "boys"]);
  });

  test("returns everything when the text is only whitespace", () => {
    expect(namesFor("   ")).toEqual(["fruits", "veg", "boys"]);
  });

  test("matches on the name", () => {
    expect(namesFor("fru")).toEqual(["fruits"]);
  });

  test("matches on the query", () => {
    expect(namesFor("carrot")).toEqual(["veg"]);
  });

  test("ignores case", () => {
    expect(namesFor("APPLE")).toEqual(["fruits"]);
  });

  test("trims the search text", () => {
    expect(namesFor("  veg  ")).toEqual(["veg"]);
  });

  test("returns every match", () => {
    expect(namesFor("apple", [createSnippet("a", "apple"), createSnippet("apple", "b")])).toEqual(["a", "apple"]);
  });

  test("ignores a leading slash", () => {
    expect(namesFor("/fru")).toEqual(["fruits"]);
  });

  test("returns everything when the text is only slashes", () => {
    expect(namesFor("//")).toEqual(["fruits", "veg", "boys"]);
  });

  test("returns nothing when nothing matches", () => {
    expect(namesFor("zzz")).toEqual([]);
  });

  test("keeps the given order", () => {
    expect(namesFor("o")).toEqual(["veg", "boys"]);
  });
});

describe("emptyText", () => {
  test("says there are no snippets yet", () => {
    expect(SnippetListing.emptyText([])).toBe("No snippets yet");
  });

  test("says nothing matches when snippets exist", () => {
    expect(SnippetListing.emptyText([createSnippet("veg", "carrot")])).toBe("No matching snippets");
  });
});
