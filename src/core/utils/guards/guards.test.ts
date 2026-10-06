import { assertNever, hasFields, isBoolean, isNumber, isOneOf, isRecord, oneOf, sameKindAs } from "@/core/utils/guards/guards";
import { describe, expect, test } from "vitest";

describe("isNumber", () => {
  test("accepts only numbers", () => {
    expect([1, "1", null].map(isNumber)).toEqual([true, false, false]);
  });
});

describe("isBoolean", () => {
  test("accepts only booleans", () => {
    expect([false, 0, "true"].map(isBoolean)).toEqual([true, false, false]);
  });
});

describe("isRecord", () => {
  test("accepts only plain objects", () => {
    expect([{}, [], null, "a"].map(isRecord)).toEqual([true, false, false, false]);
  });
});

describe("isOneOf", () => {
  test("accepts only members", () => {
    expect([0, null, 9, "0"].map(value => isOneOf([0, null], value))).toEqual([true, true, false, false]);
  });
});

describe("assertNever", () => {
  test("throws for a value the types said couldn't arrive", () => {
    expect(() => assertNever("gone" as never)).toThrow("Unexpected value: gone");
  });
});

describe("oneOf", () => {
  test("accepts only members", () => {
    expect(["row", "grid", 1].map(oneOf(["row", "column"]))).toEqual([true, false, false]);
  });
});

describe("hasFields", () => {
  const isSize = hasFields({ unit: oneOf(["px", "em"] as const), amount: isNumber });

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

describe("sameKindAs", () => {
  test("accepts only values of the example's kind", () => {
    expect([1, "1", null, []].map(sameKindAs(0))).toEqual([true, false, false, false]);
  });

  test("tells arrays and null apart from objects", () => {
    expect([[], {}, null].map(sameKindAs<unknown>([]))).toEqual([true, false, false]);
    expect([null, {}].map(sameKindAs<unknown>(null))).toEqual([true, false]);
  });
});
