import { describe, expect, test } from "vitest";
import { createListGuard } from "@/core/utils/guard/list_guard";
import { isNumber } from "@/core/utils/guard/unknown_utilities";

describe("createListGuard", () => {
  test("accepts an array whose every item its guard accepts, empty included", () => {
    expect([[], [1, 2]].map(createListGuard(isNumber))).toEqual([true, true]);
  });

  test.each([
    ["an item its guard rejects", [1, "2"]],
    ["a non-array", { 0: 1 }]
  ])("rejects %s", (_, raw) => {
    expect(createListGuard(isNumber)(raw)).toBe(false);
  });
});
