import { AppMode, ColorScheme } from "@/core/boundary/environment";
import { describe, expect, test, vi } from "vitest";
import { Rule34HostPage } from "@/adapters/rule34/ports/host_page/host_page";

interface Rule34 {
  clearNativePage: ReturnType<typeof vi.fn<() => void>>;
  setHeaderVisible: ReturnType<typeof vi.fn<(visible: boolean) => void>>;
  setTheme: ReturnType<typeof vi.fn<(colorScheme: ColorScheme) => void>>;
}

interface Page {
  lockViewport: ReturnType<typeof vi.fn<() => void>>;
  lockScroll: ReturnType<typeof vi.fn<() => void>>;
  unlockScroll: ReturnType<typeof vi.fn<() => void>>;
}

function createRule34(): Rule34 {
  return {
    clearNativePage: vi.fn<() => void>(),
    setHeaderVisible: vi.fn<(visible: boolean) => void>(),
    setTheme: vi.fn<(colorScheme: ColorScheme) => void>()
  };
}

function createPage(): Page {
  return {
    lockViewport: vi.fn<() => void>(),
    lockScroll: vi.fn<() => void>(),
    unlockScroll: vi.fn<() => void>()
  };
}

function clearedFor(mode: AppMode): boolean {
  const rule34 = createRule34();

  new Rule34HostPage(rule34, createPage(), mode).clearContent();
  return rule34.clearNativePage.mock.calls.length > 0;
}

describe("Rule34HostPage", () => {
  test("clears the favorites page", () => {
    expect(clearedFor("favorites")).toBe(true);
  });

  test("leaves the post list page alone", () => {
    expect(clearedFor("postList")).toBe(false);
  });

  test("shows and hides the site's header", () => {
    const rule34 = createRule34();
    const hostPage = new Rule34HostPage(rule34, createPage(), "favorites");

    expect(hostPage.hasHeader).toBe(true);
    hostPage.setHeaderVisible(false);
    hostPage.setHeaderVisible(true);
    expect(rule34.setHeaderVisible.mock.calls).toEqual([[false], [true]]);
  });

  test("remembers the theme on the site", () => {
    const rule34 = createRule34();

    new Rule34HostPage(rule34, createPage(), "favorites").setColorScheme("dark");
    expect(rule34.setTheme.mock.calls).toEqual([["dark"]]);
  });

  test("leaves the viewport and scrolling to the browser page", () => {
    const page = createPage();
    const hostPage = new Rule34HostPage(createRule34(), page, "favorites");

    hostPage.lockViewport();
    hostPage.lockScroll();
    hostPage.unlockScroll();
    expect(page.lockViewport).toHaveBeenCalledOnce();
    expect(page.lockScroll).toHaveBeenCalledOnce();
    expect(page.unlockScroll).toHaveBeenCalledOnce();
  });
});
