import { describe, expect, test } from "vitest";
import { Snippet } from "@/features/favorites/features/snippets/types";
import { sortByRecentlyUsed } from "@/features/favorites/features/snippets/sorter";

const snippet = (name: string, lastUsedAt: number, createdAt = 0): Snippet => ({ name, query: "x", lastUsedAt, createdAt });
const namesOf = (snippets: Snippet[]): string[] => snippets.map(s => s.name);

describe("sortByRecentlyUsed", () => {
  test("orders the most recently used first", () => {
    const snippets = [snippet("old", 100), snippet("new", 300), snippet("mid", 200)];

    expect(namesOf(sortByRecentlyUsed(snippets))).toEqual(["new", "mid", "old"]);
  });

  test("breaks ties on last use with the most recently created", () => {
    const snippets = [snippet("first", 0, 100), snippet("third", 0, 300), snippet("second", 0, 200)];

    expect(namesOf(sortByRecentlyUsed(snippets))).toEqual(["third", "second", "first"]);
  });

  test("orders by last use before creation", () => {
    const snippets = [snippet("newest", 100, 999), snippet("used", 500, 1)];

    expect(namesOf(sortByRecentlyUsed(snippets))).toEqual(["used", "newest"]);
  });

  test("puts a never used snippet last", () => {
    const snippets = [snippet("never", 0, 999), snippet("used", 1, 1)];

    expect(namesOf(sortByRecentlyUsed(snippets))).toEqual(["used", "never"]);
  });

  test("returns an empty array unchanged", () => {
    expect(sortByRecentlyUsed([])).toEqual([]);
  });

  test("does not mutate the given array", () => {
    const snippets = [snippet("a", 100), snippet("b", 300)];

    sortByRecentlyUsed(snippets);
    expect(namesOf(snippets)).toEqual(["a", "b"]);
  });
});
