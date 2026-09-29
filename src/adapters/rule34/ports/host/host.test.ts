import { describe, expect, test, vi } from "vitest";
import { AppMode } from "@/core/boundary/environment";
import { Rule34Host } from "@/adapters/rule34/ports/host/host";

interface Rule34 {
  clearNativePage: ReturnType<typeof vi.fn<() => void>>;
  setHeaderVisible: ReturnType<typeof vi.fn<(visible: boolean) => void>>;
  lockViewport: ReturnType<typeof vi.fn<() => void>>;
}

function createRule34(): Rule34 {
  return {
    clearNativePage: vi.fn<() => void>(),
    setHeaderVisible: vi.fn<(visible: boolean) => void>(),
    lockViewport: vi.fn<() => void>()
  };
}

function clearedFor(mode: AppMode): boolean {
  const rule34 = createRule34();

  new Rule34Host(rule34, mode).takeOver();
  return rule34.clearNativePage.mock.calls.length > 0;
}

describe("Rule34Host", () => {
  test("clears the favorites page", () => {
    expect(clearedFor("favorites")).toBe(true);
  });

  test("leaves the post list page alone", () => {
    expect(clearedFor("postList")).toBe(false);
  });

  test("shows and hides the site's header", () => {
    const rule34 = createRule34();
    const host = new Rule34Host(rule34, "favorites");

    expect(host.hasHeader).toBe(true);
    host.setHeaderVisible(false);
    host.setHeaderVisible(true);
    expect(rule34.setHeaderVisible.mock.calls).toEqual([[false], [true]]);
  });

  test("locks the site's viewport", () => {
    const rule34 = createRule34();

    new Rule34Host(rule34, "favorites").lockViewport();
    expect(rule34.lockViewport).toHaveBeenCalledOnce();
  });
});
