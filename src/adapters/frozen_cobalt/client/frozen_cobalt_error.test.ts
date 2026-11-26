import { FrozenCobaltError, isRetryableFrozenCobaltError } from "@/adapters/frozen_cobalt/client/frozen_cobalt_error";
import { describe, expect, test } from "vitest";

describe("FrozenCobaltError", () => {
  test("names itself", () => {
    expect(new FrozenCobaltError("http").name).toBe("FrozenCobaltError");
  });
});

describe("isRetryableFrozenCobaltError", () => {
  test.each<[FrozenCobaltError["reason"], boolean]>([
    ["timeout", true],
    ["network", true],
    ["retry", true],
    ["malformed", false]
  ])("classifies %s as retryable: %s", (frozenCobaltErrorReason, expected) => {
    expect(isRetryableFrozenCobaltError(new FrozenCobaltError(frozenCobaltErrorReason))).toBe(expected);
  });

  test.each([
    [429, true],
    [500, true],
    [503, true],
    [400, false],
    [404, false]
  ])("classifies http %i as retryable: %s", (status, expected) => {
    expect(isRetryableFrozenCobaltError(new FrozenCobaltError("http", { status }))).toBe(expected);
  });

  test("treats http without a status as permanent", () => {
    expect(isRetryableFrozenCobaltError(new FrozenCobaltError("http"))).toBe(false);
  });

  test("treats any other error as permanent", () => {
    expect(isRetryableFrozenCobaltError(new Error("timeout"))).toBe(false);
  });

  test("throws for an unknown reason", () => {
    expect(() => isRetryableFrozenCobaltError(new FrozenCobaltError("bogus" as FrozenCobaltError["reason"]))).toThrow("bogus");
  });
});
