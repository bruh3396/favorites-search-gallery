import { FrozenCobaltError, FrozenCobaltErrorReason, isTransient } from "@/adapters/frozen_cobalt/client/error";
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

describe("isTransient", () => {
  test.each<[FrozenCobaltErrorReason, boolean]>([
    ["timeout", true],
    ["network", true],
    ["rate_limited", true],
    ["deferred", true],
    ["server_error", true],
    ["malformed", false],
    ["unknown_file", false]
  ])("%s is transient: %s", (reason, expected) => {
    expect(isTransient(new FrozenCobaltError(reason))).toBe(expected);
  });

  test.each([
    [429, true],
    [500, true],
    [503, true],
    [400, false],
    [404, false]
  ])("http %i is transient: %s", (status, expected) => {
    expect(isTransient(new FrozenCobaltError("http", { status }))).toBe(expected);
  });

  test("treats http without a status as permanent", () => {
    expect(isTransient(new FrozenCobaltError("http"))).toBe(false);
  });

  test("treats any other error as permanent", () => {
    expect(isTransient(new Error("timeout"))).toBe(false);
  });

  test("throws for an unknown reason", () => {
    expect(() => isTransient(new FrozenCobaltError("bogus" as FrozenCobaltErrorReason))).toThrow("bogus");
  });
});
