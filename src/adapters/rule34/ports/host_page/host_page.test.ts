import { AppMode, ColorScheme } from "@/core/boundary/environment";
import { describe, expect, test, vi } from "vitest";
import { Rule34HostPage } from "@/adapters/rule34/ports/host_page/host_page";

interface Rule34 {
  clearNativePage: ReturnType<typeof vi.fn<() => void>>;
  setHeaderVisible: ReturnType<typeof vi.fn<(visible: boolean) => void>>;
  setTheme: ReturnType<typeof vi.fn<(colorScheme: ColorScheme) => void>>;
  reflectPostListPage: ReturnType<typeof vi.fn<(pageIndex: number) => void>>;
  setPaginatorVisible: ReturnType<typeof vi.fn<(visible: boolean) => void>>;
}

interface Page {
  claimContent: ReturnType<typeof vi.fn<() => HTMLElement>>;
  lockViewport: ReturnType<typeof vi.fn<() => void>>;
  lockScroll: ReturnType<typeof vi.fn<() => void>>;
  unlockScroll: ReturnType<typeof vi.fn<() => void>>;
}

const CONTENT = {} as HTMLElement;

function createRule34(): Rule34 {
  return {
    clearNativePage: vi.fn<() => void>(),
    setHeaderVisible: vi.fn<(visible: boolean) => void>(),
    setTheme: vi.fn<(colorScheme: ColorScheme) => void>(),
    reflectPostListPage: vi.fn<(pageIndex: number) => void>(),
    setPaginatorVisible: vi.fn<(visible: boolean) => void>()
  };
}

function createPage(): Page {
  return {
    claimContent: vi.fn<() => HTMLElement>(() => CONTENT),
    lockViewport: vi.fn<() => void>(),
    lockScroll: vi.fn<() => void>(),
    unlockScroll: vi.fn<() => void>()
  };
}

function clearedFor(mode: AppMode): boolean {
  const rule34 = createRule34();

  new Rule34HostPage({ mode }, { rule34, page: createPage() }).claimContent();
  return rule34.clearNativePage.mock.calls.length > 0;
}

describe("Rule34HostPage", () => {
  test("clears the favorites page", () => {
    expect(clearedFor("favorites")).toBe(true);
  });

  test("leaves the post list page alone", () => {
    expect(clearedFor("postList")).toBe(false);
  });

  test("gives the app the browser page's content element", () => {
    const hostPage = new Rule34HostPage({ mode: "favorites" }, { rule34: createRule34(), page: createPage() });

    expect(hostPage.claimContent()).toBe(CONTENT);
  });

  test("shows and hides the site's header", () => {
    const rule34 = createRule34();
    const hostPage = new Rule34HostPage({ mode: "favorites" }, { rule34, page: createPage() });

    expect(hostPage.hasHeader).toBe(true);
    hostPage.setHeaderVisible(false);
    hostPage.setHeaderVisible(true);
    expect(rule34.setHeaderVisible.mock.calls).toEqual([[false], [true]]);
  });

  test("remembers the theme on the site", () => {
    const rule34 = createRule34();

    new Rule34HostPage({ mode: "favorites" }, { rule34, page: createPage() }).setColorScheme("dark");
    expect(rule34.setTheme.mock.calls).toEqual([["dark"]]);
  });

  test("reflects the search page on the site's paginator and address", () => {
    const rule34 = createRule34();

    new Rule34HostPage({ mode: "postList" }, { rule34, page: createPage() }).reflectSearchPage(3);
    expect(rule34.reflectPostListPage.mock.calls).toEqual([[3]]);
  });

  test("shows and hides the site's paginator", () => {
    const rule34 = createRule34();
    const hostPage = new Rule34HostPage({ mode: "postList" }, { rule34, page: createPage() });

    hostPage.setPaginatorVisible(false);
    hostPage.setPaginatorVisible(true);
    expect(rule34.setPaginatorVisible.mock.calls).toEqual([[false], [true]]);
  });

  test("leaves the viewport and scrolling to the browser page", () => {
    const page = createPage();
    const hostPage = new Rule34HostPage({ mode: "favorites" }, { rule34: createRule34(), page });

    hostPage.lockViewport();
    hostPage.lockScroll();
    hostPage.unlockScroll();
    expect(page.lockViewport).toHaveBeenCalledOnce();
    expect(page.lockScroll).toHaveBeenCalledOnce();
    expect(page.unlockScroll).toHaveBeenCalledOnce();
  });
});
