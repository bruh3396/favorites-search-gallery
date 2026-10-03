import { assertNever, isOneOf, isRecord, oneOf, sameKindAs } from "@/core/utils/guards/guards";
import { describe, expect, test } from "vitest";

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

describe("sameKindAs", () => {
  test("accepts only values of the example's kind", () => {
    expect([1, "1", null, []].map(sameKindAs(0))).toEqual([true, false, false, false]);
  });

  test("tells arrays and null apart from objects", () => {
    expect([[], {}, null].map(sameKindAs<unknown>([]))).toEqual([true, false, false]);
    expect([null, {}].map(sameKindAs<unknown>(null))).toEqual([true, false]);
  });
});
