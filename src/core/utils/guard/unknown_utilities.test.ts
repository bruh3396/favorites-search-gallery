import { describe, expect, test } from "vitest";
import { isBoolean, isInUnitInterval, isNumber, isOneOf, isRecord, isString } from "@/core/utils/guard/unknown_utilities";

describe("isNumber", () => {
  test("accepts only numbers", () => {
    expect([1, "1", null].map(isNumber)).toEqual([true, false, false]);
  });
});

describe("isString", () => {
  test("accepts only strings", () => {
    expect(["", "a", 1, null].map(isString)).toEqual([true, true, false, false]);
  });
});

describe("isBoolean", () => {
  test("accepts only booleans", () => {
    expect([false, 0, "true"].map(isBoolean)).toEqual([true, false, false]);
  });
});

describe("isInUnitInterval", () => {
  test("accepts only numbers from zero to one", () => {
    expect([0, 0.5, 1, -0.1, 1.1, NaN, Infinity, "0.5"].map(isInUnitInterval)).toEqual([true, true, true, false, false, false, false, false]);
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
