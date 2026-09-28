import { describe, expect, test, vi } from "vitest";
import { AppMode } from "@/core/boundary/environment";
import { Rule34Host } from "@/adapters/rule34/host/host";

function clearedFor(mode: AppMode): boolean {
  const site = { clearNativePage: vi.fn() };

  new Rule34Host(site).takeOver(mode);
  return site.clearNativePage.mock.calls.length > 0;
}

describe("Rule34Host", () => {
  test("clears the favorites page", () => {
    expect(clearedFor("favorites")).toBe(true);
  });

  test("leaves the post list page alone", () => {
    expect(clearedFor("posts")).toBe(false);
  });
});
