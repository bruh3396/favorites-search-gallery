import { assertNever, isOneOf, isRecord } from "@/core/utils/guards/guards";
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
