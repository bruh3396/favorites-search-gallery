import { Rule34Error, Rule34ErrorReason, isTransient } from "@/adapters/rule34/client/error";
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

describe("isTransient", () => {
  test.each<[Rule34ErrorReason, boolean]>([
    ["network", true],
    ["malformed", false]
  ])("%s is transient: %s", (reason, expected) => {
    expect(isTransient(new Rule34Error(reason))).toBe(expected);
  });

  test.each([
    [429, true],
    [500, true],
    [503, true],
    [400, false],
    [404, false]
  ])("http %i is transient: %s", (status, expected) => {
    expect(isTransient(new Rule34Error("http", { status }))).toBe(expected);
  });

  test("is false for any other error", () => {
    expect(isTransient(new Error("network"))).toBe(false);
  });
});
