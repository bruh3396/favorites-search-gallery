import * as SnippetIdQuery from "@/features/favorites/features/snippets/model/id_query";
import { expect, test } from "vitest";

test("joins ids with tildes inside parentheses", () => {
  expect(SnippetIdQuery.build(["1", "2", "3"])).toBe("( 1 ~ 2 ~ 3 )");
});

test("wraps a single id", () => {
  expect(SnippetIdQuery.build(["42"])).toBe("( 42 )");
});

test("returns empty string when there are no ids", () => {
  expect(SnippetIdQuery.build([])).toBe("");
});
