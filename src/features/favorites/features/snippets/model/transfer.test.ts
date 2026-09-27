import * as SnippetTransfer from "@/features/favorites/features/snippets/model/transfer";
import { describe, expect, test } from "vitest";

describe("parse", () => {
  test("reads exported entries", () => {
    const contents = JSON.stringify([{ name: "fruits", query: "apple" }, { name: "veg", query: "carrot" }]);

    expect(SnippetTransfer.parse(contents)).toEqual([{ name: "fruits", query: "apple" }, { name: "veg", query: "carrot" }]);
  });

  test("ignores extra fields", () => {
    const contents = JSON.stringify([{ name: "fruits", query: "apple", lastUsedAt: 99, createdAt: 5 }]);

    expect(SnippetTransfer.parse(contents)).toEqual([{ name: "fruits", query: "apple" }]);
  });

  test("skips entries without a name", () => {
    const contents = JSON.stringify([{ query: "apple" }, { name: "veg", query: "carrot" }]);

    expect(SnippetTransfer.parse(contents)).toEqual([{ name: "veg", query: "carrot" }]);
  });

  test("skips entries without a query", () => {
    const contents = JSON.stringify([{ name: "fruits" }, { name: "veg", query: "carrot" }]);

    expect(SnippetTransfer.parse(contents)).toEqual([{ name: "veg", query: "carrot" }]);
  });

  test("skips entries whose name is empty", () => {
    expect(SnippetTransfer.parse(JSON.stringify([{ name: "   ", query: "apple" }]))).toEqual([]);
  });

  test("skips entries whose query is empty", () => {
    expect(SnippetTransfer.parse(JSON.stringify([{ name: "fruits", query: "   " }]))).toEqual([]);
  });

  test("skips entries whose fields are not strings", () => {
    expect(SnippetTransfer.parse(JSON.stringify([{ name: 42, query: "apple" }]))).toEqual([]);
  });

  test("skips bare query strings", () => {
    expect(SnippetTransfer.parse(JSON.stringify(["apple", { name: "veg", query: "carrot" }]))).toEqual([{ name: "veg", query: "carrot" }]);
  });

  test("skips entries that are neither strings nor objects", () => {
    const contents = JSON.stringify([42, null, true, { name: "veg", query: "carrot" }]);

    expect(SnippetTransfer.parse(contents)).toEqual([{ name: "veg", query: "carrot" }]);
  });

  test("returns nothing for malformed json", () => {
    expect(SnippetTransfer.parse("{not json")).toEqual([]);
  });

  test("returns nothing when the json is not an array", () => {
    expect(SnippetTransfer.parse(JSON.stringify({ snippets: [] }))).toEqual([]);
  });

  test("returns nothing for an empty file", () => {
    expect(SnippetTransfer.parse("")).toEqual([]);
  });

  test("keeps the file order", () => {
    const contents = JSON.stringify([{ name: "a", query: "1" }, { name: "b", query: "2" }, { name: "c", query: "3" }]);

    expect(SnippetTransfer.parse(contents).map(entry => entry.name)).toEqual(["a", "b", "c"]);
  });
});

describe("serialize", () => {
  test("writes only names and queries as json", async() => {
    const blob = SnippetTransfer.serialize([{ name: "fruits", query: "apple", lastUsedAt: 9, createdAt: 5 }]);

    expect(blob.type).toBe("application/json");
    expect(JSON.parse(await blob.text())).toEqual([{ name: "fruits", query: "apple" }]);
  });

  test("round-trips through parse", async() => {
    const blob = SnippetTransfer.serialize([{ name: "a", query: "1", lastUsedAt: 0, createdAt: 0 }, { name: "b", query: "2", lastUsedAt: 0, createdAt: 0 }]);

    expect(SnippetTransfer.parse(await blob.text())).toEqual([{ name: "a", query: "1" }, { name: "b", query: "2" }]);
  });
});
