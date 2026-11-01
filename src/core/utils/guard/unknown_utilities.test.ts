import { isBoolean, isInUnitInterval, isNumber, isOneOf, isRecord } from "@/core/utils/guard/unknown_utilities";
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
