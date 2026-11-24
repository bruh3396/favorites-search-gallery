import { describe, expect, test } from "vitest";
import { createSameKindGuard } from "@/core/utils/guard/same_kind_guard";

describe("createSameKindGuard", () => {
  test("accepts only values of the example's kind", () => {
    expect([1, "1", null, []].map(createSameKindGuard(0))).toEqual([true, false, false, false]);
  });

  test("tells arrays and null apart from objects", () => {
    expect([[], {}, null].map(createSameKindGuard<unknown>([]))).toEqual([true, false, false]);
    expect([null, {}].map(createSameKindGuard<unknown>(null))).toEqual([true, false]);
  });
});
