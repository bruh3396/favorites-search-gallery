import { THEME_DEFINITIONS, ThemeDefinition } from "@/core/ui/theme/theme";
import { describe, expect, test, vi } from "vitest";
import { AppMode } from "@/core/boundary/app_mode";
import { ColorScheme } from "@/core/boundary/color_scheme";
import { Rule34HostPage } from "@/adapters/rule34/ports/host_page/rule34_host_page";

interface Rule34Document {
  clearNativePage: ReturnType<typeof vi.fn<() => void>>;
  claimPostListContent: ReturnType<typeof vi.fn<() => HTMLElement | null>>;
  setHeaderVisible: ReturnType<typeof vi.fn<(visible: boolean) => void>>;
  setColorScheme: ReturnType<typeof vi.fn<(colorScheme: ColorScheme) => void>>;
  setTheme: ReturnType<typeof vi.fn<(themeDefinition: ThemeDefinition) => void>>;
  reflectPostListPage: ReturnType<typeof vi.fn<(pageIndex: number) => void>>;
  setPaginatorVisible: ReturnType<typeof vi.fn<(visible: boolean) => void>>;
}

const CONTENT = {} as HTMLElement;
const POST_LIST_CONTENT = {} as HTMLElement;

function createRule34Document(postListContent: HTMLElement | null = POST_LIST_CONTENT): Rule34Document {
  return {
    clearNativePage: vi.fn<() => void>(),
    claimPostListContent: vi.fn<() => HTMLElement | null>(() => postListContent),
    setHeaderVisible: vi.fn<(visible: boolean) => void>(),
    setColorScheme: vi.fn<(colorScheme: ColorScheme) => void>(),
    setTheme: vi.fn<(themeDefinition: ThemeDefinition) => void>(),
    reflectPostListPage: vi.fn<(pageIndex: number) => void>(),
    setPaginatorVisible: vi.fn<(visible: boolean) => void>()
  };
}

function claimBodyContent(): HTMLElement {
  return CONTENT;
}

function clearsNativePage(appMode: AppMode): boolean {
  const rule34Document = createRule34Document();

  new Rule34HostPage({ appMode }, { rule34Document, claimBodyContent }).claimContent();
  return rule34Document.clearNativePage.mock.calls.length > 0;
}

describe("Rule34HostPage", () => {
  test("clears the favorites page", () => {
    expect(clearsNativePage("favorites")).toBe(true);
  });

  test("leaves the post list page alone", () => {
    expect(clearsNativePage("postList")).toBe(false);
  });

  test("gives the app its own element in the body on the favorites page", () => {
    const hostPage = new Rule34HostPage({ appMode: "favorites" }, { rule34Document: createRule34Document(), claimBodyContent });

    expect(hostPage.claimContent()).toBe(CONTENT);
  });

  test("gives the app the post list's content element", () => {
    const hostPage = new Rule34HostPage({ appMode: "postList" }, { rule34Document: createRule34Document(), claimBodyContent });

    expect(hostPage.claimContent()).toBe(POST_LIST_CONTENT);
  });

  test("falls back to its own element in the body when the post list has none", () => {
    const hostPage = new Rule34HostPage({ appMode: "postList" }, { rule34Document: createRule34Document(null), claimBodyContent });

    expect(hostPage.claimContent()).toBe(CONTENT);
  });

  test("shows and hides the site's header", () => {
    const rule34Document = createRule34Document();
    const hostPage = new Rule34HostPage({ appMode: "favorites" }, { rule34Document, claimBodyContent });

    expect(hostPage.hasHeader).toBe(true);
    hostPage.setHeaderVisible(false);
    hostPage.setHeaderVisible(true);
    expect(rule34Document.setHeaderVisible.mock.calls).toEqual([[false], [true]]);
  });

  test("sets the site's color scheme", () => {
    const rule34Document = createRule34Document();

    new Rule34HostPage({ appMode: "favorites" }, { rule34Document, claimBodyContent }).setColorScheme("dark");
    expect(rule34Document.setColorScheme.mock.calls).toEqual([["dark"]]);
  });

  test("themes the site", () => {
    const rule34Document = createRule34Document();

    new Rule34HostPage({ appMode: "favorites" }, { rule34Document, claimBodyContent }).setTheme(THEME_DEFINITIONS.cherry);
    expect(rule34Document.setTheme.mock.calls).toEqual([[THEME_DEFINITIONS.cherry]]);
  });

  test("reflects the search page on the site's paginator and address", () => {
    const rule34Document = createRule34Document();

    new Rule34HostPage({ appMode: "postList" }, { rule34Document, claimBodyContent }).reflectSearchPage(3);
    expect(rule34Document.reflectPostListPage.mock.calls).toEqual([[3]]);
  });

  test("shows and hides the site's paginator", () => {
    const rule34Document = createRule34Document();
    const hostPage = new Rule34HostPage({ appMode: "postList" }, { rule34Document, claimBodyContent });

    hostPage.setPaginatorVisible(false);
    hostPage.setPaginatorVisible(true);
    expect(rule34Document.setPaginatorVisible.mock.calls).toEqual([[false], [true]]);
  });
});
