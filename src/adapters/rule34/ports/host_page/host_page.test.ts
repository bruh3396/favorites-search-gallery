import { AppMode, ColorScheme } from "@/core/boundary/environment";
import { describe, expect, test, vi } from "vitest";
import { Rule34HostPage } from "@/adapters/rule34/ports/host_page/host_page";

interface Rule34Document {
  clearNativePage: ReturnType<typeof vi.fn<() => void>>;
  claimPostListContent: ReturnType<typeof vi.fn<() => HTMLElement | null>>;
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
const POST_LIST_CONTENT = {} as HTMLElement;

function createRule34Document(postListContent: HTMLElement | null = POST_LIST_CONTENT): Rule34Document {
  return {
    clearNativePage: vi.fn<() => void>(),
    claimPostListContent: vi.fn<() => HTMLElement | null>(() => postListContent),
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

function clearsNativePage(mode: AppMode): boolean {
  const rule34Document = createRule34Document();

  new Rule34HostPage({ mode }, { rule34Document, page: createPage() }).claimContent();
  return rule34Document.clearNativePage.mock.calls.length > 0;
}

describe("Rule34HostPage", () => {
  test("clears the favorites page", () => {
    expect(clearsNativePage("favorites")).toBe(true);
  });

  test("leaves the post list page alone", () => {
    expect(clearsNativePage("postList")).toBe(false);
  });

  test("gives the app the browser page's content element on the favorites page", () => {
    const hostPage = new Rule34HostPage({ mode: "favorites" }, { rule34Document: createRule34Document(), page: createPage() });

    expect(hostPage.claimContent()).toBe(CONTENT);
  });

  test("gives the app the post list's content element", () => {
    const hostPage = new Rule34HostPage({ mode: "postList" }, { rule34Document: createRule34Document(), page: createPage() });

    expect(hostPage.claimContent()).toBe(POST_LIST_CONTENT);
  });

  test("falls back to the browser page's content element when the post list has none", () => {
    const hostPage = new Rule34HostPage({ mode: "postList" }, { rule34Document: createRule34Document(null), page: createPage() });

    expect(hostPage.claimContent()).toBe(CONTENT);
  });

  test("shows and hides the site's header", () => {
    const rule34Document = createRule34Document();
    const hostPage = new Rule34HostPage({ mode: "favorites" }, { rule34Document, page: createPage() });

    expect(hostPage.hasHeader).toBe(true);
    hostPage.setHeaderVisible(false);
    hostPage.setHeaderVisible(true);
    expect(rule34Document.setHeaderVisible.mock.calls).toEqual([[false], [true]]);
  });

  test("remembers the theme on the site", () => {
    const rule34Document = createRule34Document();

    new Rule34HostPage({ mode: "favorites" }, { rule34Document, page: createPage() }).setColorScheme("dark");
    expect(rule34Document.setTheme.mock.calls).toEqual([["dark"]]);
  });

  test("reflects the search page on the site's paginator and address", () => {
    const rule34Document = createRule34Document();

    new Rule34HostPage({ mode: "postList" }, { rule34Document, page: createPage() }).reflectSearchPage(3);
    expect(rule34Document.reflectPostListPage.mock.calls).toEqual([[3]]);
  });

  test("shows and hides the site's paginator", () => {
    const rule34Document = createRule34Document();
    const hostPage = new Rule34HostPage({ mode: "postList" }, { rule34Document, page: createPage() });

    hostPage.setPaginatorVisible(false);
    hostPage.setPaginatorVisible(true);
    expect(rule34Document.setPaginatorVisible.mock.calls).toEqual([[false], [true]]);
  });

  test("leaves the viewport and scrolling to the browser page", () => {
    const page = createPage();
    const hostPage = new Rule34HostPage({ mode: "favorites" }, { rule34Document: createRule34Document(), page });

    hostPage.lockViewport();
    hostPage.lockScroll();
    hostPage.unlockScroll();
    expect(page.lockViewport).toHaveBeenCalledOnce();
    expect(page.lockScroll).toHaveBeenCalledOnce();
    expect(page.unlockScroll).toHaveBeenCalledOnce();
  });
});
