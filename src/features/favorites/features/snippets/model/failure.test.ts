import * as SnippetFailure from "@/features/favorites/features/snippets/model/failure";
import { describe, expect, test } from "vitest";

describe("describe", () => {
  test("explains an empty name", () => {
    expect(SnippetFailure.describe("empty-name", "")).toBe("A snippet needs a name");
  });

  test("explains an empty query", () => {
    expect(SnippetFailure.describe("empty-query", "fruits")).toBe("A snippet needs a query");
  });

  test("names the snippet that already exists", () => {
    expect(SnippetFailure.describe("duplicate-name", "fruits")).toBe("A snippet named /fruits already exists");
  });

  test("explains a missing snippet", () => {
    expect(SnippetFailure.describe("not-found", "fruits")).toBe("That snippet no longer exists");
  });
});
