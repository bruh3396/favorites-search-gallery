import { describe, expect, test } from "vitest";
import { importSnippets } from "@/features/favorites/features/snippets/transfer";

describe("importSnippets", () => {
  test("reads exported entries", () => {
    const contents = JSON.stringify([{ name: "fruits", query: "apple" }, { name: "veg", query: "carrot" }]);

    expect(importSnippets(contents)).toEqual([{ name: "fruits", query: "apple" }, { name: "veg", query: "carrot" }]);
  });

  test("ignores extra fields", () => {
    const contents = JSON.stringify([{ name: "fruits", query: "apple", lastUsedAt: 99, createdAt: 5 }]);

    expect(importSnippets(contents)).toEqual([{ name: "fruits", query: "apple" }]);
  });

  test("skips entries without a name", () => {
    const contents = JSON.stringify([{ query: "apple" }, { name: "veg", query: "carrot" }]);

    expect(importSnippets(contents)).toEqual([{ name: "veg", query: "carrot" }]);
  });

  test("skips entries without a query", () => {
    const contents = JSON.stringify([{ name: "fruits" }, { name: "veg", query: "carrot" }]);

    expect(importSnippets(contents)).toEqual([{ name: "veg", query: "carrot" }]);
  });

  test("skips entries whose name is empty", () => {
    expect(importSnippets(JSON.stringify([{ name: "   ", query: "apple" }]))).toEqual([]);
  });

  test("skips entries whose query is empty", () => {
    expect(importSnippets(JSON.stringify([{ name: "fruits", query: "   " }]))).toEqual([]);
  });

  test("skips entries whose fields are not strings", () => {
    expect(importSnippets(JSON.stringify([{ name: 42, query: "apple" }]))).toEqual([]);
  });

  test("skips bare query strings", () => {
    expect(importSnippets(JSON.stringify(["apple", { name: "veg", query: "carrot" }]))).toEqual([{ name: "veg", query: "carrot" }]);
  });

  test("skips entries that are neither strings nor objects", () => {
    const contents = JSON.stringify([42, null, true, { name: "veg", query: "carrot" }]);

    expect(importSnippets(contents)).toEqual([{ name: "veg", query: "carrot" }]);
  });

  test("returns nothing for malformed json", () => {
    expect(importSnippets("{not json")).toEqual([]);
  });

  test("returns nothing when the json is not an array", () => {
    expect(importSnippets(JSON.stringify({ snippets: [] }))).toEqual([]);
  });

  test("returns nothing for an empty file", () => {
    expect(importSnippets("")).toEqual([]);
  });

  test("keeps the file order", () => {
    const contents = JSON.stringify([{ name: "a", query: "1" }, { name: "b", query: "2" }, { name: "c", query: "3" }]);

    expect(importSnippets(contents).map(entry => entry.name)).toEqual(["a", "b", "c"]);
  });
});
