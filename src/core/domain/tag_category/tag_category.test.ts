import { TAG_CATEGORIES, isTagCategory } from "@/core/domain/tag_category/tag_category";
import { describe, expect, test } from "vitest";

describe("isTagCategory", () => {
  test("accepts every category", () => {
    for (const category of TAG_CATEGORIES) {
      expect(isTagCategory(category)).toBe(true);
    }
  });

  test("rejects raw tag types that are not categories", () => {
    expect(isTagCategory("tag")).toBe(false);
  });

  test("rejects other strings and non-strings", () => {
    expect(isTagCategory("")).toBe(false);
    expect(isTagCategory("Artist")).toBe(false);
    expect(isTagCategory(1)).toBe(false);
    expect(isTagCategory(null)).toBe(false);
  });
});
