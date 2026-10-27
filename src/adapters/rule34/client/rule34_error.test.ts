import { Rule34Error, Rule34ErrorReason, isRetryableRule34Error } from "@/adapters/rule34/client/rule34_error";
import { describe, expect, test } from "vitest";

describe("Rule34Error", () => {
  test("names its reason, subject, and status", () => {
    expect(new Rule34Error("http", { subject: "https://rule34.xxx/", status: 503 }).message)
      .toBe("http https://rule34.xxx/ 503");
  });

  test("keeps its cause", () => {
    const cause = new TypeError("offline");

    expect(new Rule34Error("network", { cause }).cause).toBe(cause);
  });
});

describe("isRetryableRule34Error", () => {
  test.each<[Rule34ErrorReason, boolean]>([
    ["network", true],
    ["malformed", false]
  ])("classifies %s as retryable: %s", (reason, expected) => {
    expect(isRetryableRule34Error(new Rule34Error(reason))).toBe(expected);
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
    expect(() => isRetryableRule34Error(new Rule34Error("bogus" as Rule34ErrorReason))).toThrow("bogus");
  });
});
