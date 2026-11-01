import { createFieldsGuard, createOneOfGuard, createSameKindGuard } from "@/core/utils/guard/guard";
import { isNumber } from "@/core/utils/guard/unknown_utilities";
import { describe, expect, test } from "vitest";

describe("createOneOfGuard", () => {
  test("accepts only members", () => {
    expect(["row", "grid", 1].map(createOneOfGuard(["row", "column"]))).toEqual([true, false, false]);
  });
});

describe("createFieldsGuard", () => {
  const isSize = createFieldsGuard({ unit: createOneOfGuard(["px", "em"] as const), amount: isNumber });

  test("accepts an object whose every field its guard accepts", () => {
    expect(isSize({ unit: "px", amount: 4 })).toBe(true);
  });

  test.each([
    ["a field its guard rejects", { unit: "pt", amount: 4 }],
    ["a missing field", { unit: "px" }],
    ["a non-object", "px"]
  ])("rejects %s", (_, raw) => {
    expect(isSize(raw)).toBe(false);
  });
});

describe("createSameKindGuard", () => {
  test("accepts only values of the example's kind", () => {
    expect([1, "1", null, []].map(createSameKindGuard(0))).toEqual([true, false, false, false]);
  });

  test("tells arrays and null apart from objects", () => {
    expect([[], {}, null].map(createSameKindGuard<unknown>([]))).toEqual([true, false, false]);
    expect([null, {}].map(createSameKindGuard<unknown>(null))).toEqual([true, false]);
  });
});
