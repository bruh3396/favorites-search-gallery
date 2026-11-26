import { Rule34Error, isRetryableRule34Error } from "@/adapters/rule34/client/rule34_error";
import { describe, expect, test } from "vitest";

describe("Rule34Error", () => {
  test("names itself", () => {
    expect(new Rule34Error("http").name).toBe("Rule34Error");
  });
});

describe("isRetryableRule34Error", () => {
  test.each<[Rule34Error["reason"], boolean]>([
    ["network", true],
    ["malformed", false]
  ])("classifies %s as retryable: %s", (rule34ErrorReason, expected) => {
    expect(isRetryableRule34Error(new Rule34Error(rule34ErrorReason))).toBe(expected);
  });

  test.each([
    [403, true],
    [429, true],
    [500, true],
    [503, true],
    [400, false],
    [404, false]
  ])("classifies http %i as retryable: %s", (status, expected) => {
    expect(isRetryableRule34Error(new Rule34Error("http", { status }))).toBe(expected);
  });

  test("treats http without a status as permanent", () => {
    expect(isRetryableRule34Error(new Rule34Error("http"))).toBe(false);
  });

  test("treats any other error as permanent", () => {
    expect(isRetryableRule34Error(new Error("network"))).toBe(false);
  });

  test("throws for an unknown reason", () => {
    expect(() => isRetryableRule34Error(new Rule34Error("bogus" as Rule34Error["reason"]))).toThrow("bogus");
  });
});
