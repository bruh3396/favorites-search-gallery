import { describe, expect, test } from "vitest";
import { isFrozenCobaltTagCategoryCode } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_tag_category_code";

describe("isFrozenCobaltTagCategoryCode", () => {
  test("accepts the six codes and null", () => {
    expect([0, 1, 2, 3, 4, 5, null].every(isFrozenCobaltTagCategoryCode)).toBe(true);
  });

  test("rejects anything else", () => {
    expect([6, -1, "0", undefined].some(isFrozenCobaltTagCategoryCode)).toBe(false);
  });
});
