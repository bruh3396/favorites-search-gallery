import { describe, expect, test } from "vitest";
import { Snippet } from "@/features/favorites/features/snippets/types";
import { filter } from "@/features/favorites/features/snippets/filter";

const snippet = (name: string, query: string): Snippet => ({ name, query, lastUsedAt: 0, createdAt: 0 });
const namesOf = (snippets: Snippet[]): string[] => snippets.map(s => s.name);

describe("filterByQuery", () => {
  test("returns every snippet when the query is empty", () => {
    const snippets = [snippet("fruits", "apple"), snippet("veg", "carrot")];

    expect(namesOf(filter(snippets, ""))).toEqual(["fruits", "veg"]);
  });

  test("ignores a query of only whitespace", () => {
    const snippets = [snippet("fruits", "apple"), snippet("veg", "carrot")];

    expect(namesOf(filter(snippets, "   "))).toEqual(["fruits", "veg"]);
  });

  test("matches against the name", () => {
    const snippets = [snippet("fruits", "apple"), snippet("veg", "carrot")];

    expect(namesOf(filter(snippets, "fru"))).toEqual(["fruits"]);
  });

  test("matches against the query", () => {
    const snippets = [snippet("fruits", "apple"), snippet("veg", "carrot")];

    expect(namesOf(filter(snippets, "carrot"))).toEqual(["veg"]);
  });

  test("matches case insensitively", () => {
    const snippets = [snippet("fruits", "APPLE")];

    expect(namesOf(filter(snippets, "FRUITS"))).toEqual(["fruits"]);
    expect(namesOf(filter(snippets, "apple"))).toEqual(["fruits"]);
  });

  test("matches anywhere in the value, not just the start", () => {
    const snippets = [snippet("fruits", "( apple ~ banana )")];

    expect(namesOf(filter(snippets, "~"))).toEqual(["fruits"]);
  });

  test("trims surrounding whitespace from the query", () => {
    const snippets = [snippet("fruits", "apple"), snippet("veg", "carrot")];

    expect(namesOf(filter(snippets, "  fruits  "))).toEqual(["fruits"]);
  });

  test("returns nothing when no snippet matches", () => {
    expect(filter([snippet("fruits", "apple")], "zzz")).toEqual([]);
  });

  test("keeps the given order", () => {
    const snippets = [snippet("a", "keep"), snippet("b", "drop"), snippet("c", "keep")];

    expect(namesOf(filter(snippets, "keep"))).toEqual(["a", "c"]);
  });

  test("does not mutate the given array", () => {
    const snippets = [snippet("fruits", "apple"), snippet("veg", "carrot")];

    filter(snippets, "fruits");
    expect(namesOf(snippets)).toEqual(["fruits", "veg"]);
  });
});
