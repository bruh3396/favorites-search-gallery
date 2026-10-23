import { describe, expect, test } from "vitest";
import { NEVER_DISABLED } from "@/core/ui/components/control";

describe("NEVER_DISABLED", () => {
  test("reads as enabled", () => {
    expect(NEVER_DISABLED.peek()).toBe(false);
  });
});
