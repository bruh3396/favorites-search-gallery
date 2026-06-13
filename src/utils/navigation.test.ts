import { describe, expect, test } from "vitest";
import { navigationDelta } from "@/utils/navigation";

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
