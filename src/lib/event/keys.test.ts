import { describe, expect, test } from "vitest";
import { isExitKey, isForwardNavigationKey, isNavigationKey, navigationDelta } from "@/lib/event/keys";

describe("isExitKey", () => {
  test("accepts exit keys", () => {
    expect(isExitKey("Escape")).toBe(true);
    expect(isExitKey("Delete")).toBe(true);
    expect(isExitKey("Backspace")).toBe(true);
  });

  test("rejects other keys and non-strings", () => {
    expect(isExitKey("escape")).toBe(false);
    expect(isExitKey("Enter")).toBe(false);
    expect(isExitKey("")).toBe(false);
    expect(isExitKey(undefined)).toBe(false);
    expect(isExitKey(27)).toBe(false);
  });
});

describe("isNavigationKey", () => {
  test("accepts forward and backward keys", () => {
    for (const key of ["a", "A", "ArrowLeft", "d", "D", "ArrowRight"]) {
      expect(isNavigationKey(key)).toBe(true);
    }
  });

  test("rejects other keys and non-strings", () => {
    expect(isNavigationKey("ArrowUp")).toBe(false);
    expect(isNavigationKey("w")).toBe(false);
    expect(isNavigationKey(null)).toBe(false);
  });
});

describe("isForwardNavigationKey", () => {
  test("accepts forward keys", () => {
    expect(isForwardNavigationKey("d")).toBe(true);
    expect(isForwardNavigationKey("D")).toBe(true);
    expect(isForwardNavigationKey("ArrowRight")).toBe(true);
  });

  test("rejects backward keys", () => {
    expect(isForwardNavigationKey("a")).toBe(false);
    expect(isForwardNavigationKey("A")).toBe(false);
    expect(isForwardNavigationKey("ArrowLeft")).toBe(false);
  });
});

describe("navigationDelta", () => {
  test("forward keys return 1", () => {
    expect(navigationDelta("d")).toBe(1);
    expect(navigationDelta("D")).toBe(1);
    expect(navigationDelta("ArrowRight")).toBe(1);
  });

  test("backward keys return -1", () => {
    expect(navigationDelta("a")).toBe(-1);
    expect(navigationDelta("A")).toBe(-1);
    expect(navigationDelta("ArrowLeft")).toBe(-1);
  });
});
