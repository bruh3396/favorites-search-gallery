import { FrozenCobaltError, FrozenCobaltErrorReason, isRetryable } from "@/adapters/frozen_cobalt/client/error";
import { describe, expect, test } from "vitest";

describe("FrozenCobaltError", () => {
  test("names its reason, subject, and status", () => {
    expect(new FrozenCobaltError("http", { subject: "1", status: 503 }).message).toBe("http 1 503");
  });

  test("keeps its cause", () => {
    const cause = new TypeError("offline");

    expect(new FrozenCobaltError("network", { cause }).cause).toBe(cause);
  });
});

describe("isRetryable", () => {
  test.each<[FrozenCobaltErrorReason, boolean]>([
    ["timeout", true],
    ["network", true],
    ["rate_limited", true],
    ["deferred", true],
    ["server_error", true],
    ["malformed", false],
    ["unknown_file", false]
  ])("classifies %s as retryable: %s", (reason, expected) => {
    expect(isRetryable(new FrozenCobaltError(reason))).toBe(expected);
  });

  test.each([
    [429, true],
    [500, true],
    [503, true],
    [400, false],
    [404, false]
  ])("classifies http %i as retryable: %s", (status, expected) => {
    expect(isRetryable(new FrozenCobaltError("http", { status }))).toBe(expected);
  });

  test("treats http without a status as permanent", () => {
    expect(isRetryable(new FrozenCobaltError("http"))).toBe(false);
  });

  test("treats any other error as permanent", () => {
    expect(isRetryable(new Error("timeout"))).toBe(false);
  });

  test("throws for an unknown reason", () => {
    expect(() => isRetryable(new FrozenCobaltError("bogus" as FrozenCobaltErrorReason))).toThrow("bogus");
  });
});
