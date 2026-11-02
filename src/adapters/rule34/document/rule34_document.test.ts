import { THEME_DEFINITIONS, ThemeColors } from "@/core/ui/theme/theme";
import { afterEach, describe, expect, test, vi } from "vitest";
import { ColorScheme } from "@/core/boundary/color_scheme";
import { Rule34Document } from "@/adapters/rule34/document/rule34_document";

const globals = window as unknown as Record<string, unknown>;
const replaceState = vi.fn<History["replaceState"]>();

function visit(query: string, cookie = ""): void {
  vi.stubGlobal("location", { href: `https://rule34.xxx/index.php?${query}` });
  vi.stubGlobal("document", { cookie, querySelectorAll: () => [] });
}

function openSearch(): void {
  vi.stubGlobal("location", { href: "https://rule34.xxx/index.php?page=post&s=list&tags=apple&pid=42" });
  vi.stubGlobal("history", { replaceState });
}

function addHeader(): HTMLElement {
  const header = document.createElement("div");

  header.id = "header";
  document.body.append(header);
  return header;
}

function addStylesheet(href: string): HTMLLinkElement {
  const stylesheet = document.createElement("link");

  stylesheet.rel = "stylesheet";
  stylesheet.title = "default";
  stylesheet.setAttribute("href", href);
  document.head.append(stylesheet);
  return stylesheet;
}

function readHeaderColors(header: HTMLElement): { background: string; text: string } {
  const link = document.createElement("a");

  header.append(link);
  return { background: getComputedStyle(header).backgroundColor, text: getComputedStyle(link).color };
}

function readExpectedColors({ surface, accent }: ThemeColors): { background: string; text: string } {
  const probe = document.createElement("div");

  probe.style.backgroundColor = surface;
  probe.style.color = accent;
  return { background: probe.style.backgroundColor, text: probe.style.color };
}

function readSiteColor(element: HTMLElement, name: string): string {
  return getComputedStyle(element).getPropertyValue(name).trim();
}

function createPaginator(text: string): HTMLElement {
  const paginator = document.createElement("div");

  paginator.id = "paginator";
  paginator.textContent = text;
  return paginator;
}

function addPaginator(text: string): HTMLElement {
  const paginator = createPaginator(text);

  document.body.append(paginator);
  return paginator;
}

function addScript(src: string): HTMLScriptElement {
  const script = document.createElement("script");

  script.type = "text/plain";
  script.setAttribute("src", src);
  document.head.append(script);
  return script;
}

function createThumb(postId: string): string {
  const image = `<img src="https://example.com/${postId}.jpg" title="apple banana">`;
  return `<span class="thumb" id="s${postId}"><a id="p${postId}">${image}</a></span>`;
}

function addContent(...postIds: string[]): HTMLElement {
  const content = document.createElement("div");

  content.id = "content";
  content.innerHTML = postIds.map(createThumb).join("");
  document.body.append(content);
  return content;
}

function addPostList(...postIds: string[]): HTMLElement {
  const postList = document.createElement("div");

  postList.id = "post-list";
  postList.innerHTML = `<div class="sidebar"></div><div class="content">${postIds.map(createThumb).join("")}</div><div id="paginator"></div>`;
  document.body.append(postList);
  return postList;
}

function readPaginatorText(): string | null | undefined {
  return document.querySelector("#paginator")?.textContent;
}

function readAddressOffset(): string | null {
  return new URL(String(replaceState.mock.lastCall?.[2])).searchParams.get("pid");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  replaceState.mockReset();
  document.head.replaceChildren();
  document.body.replaceChildren();
});

describe("Rule34Document", () => {
  describe("readPageName", () => {
    test.each([
      ["page=favorites&s=view&id=1", "favorites"],
      ["page=post&s=list&tags=apple", "postList"],
      ["page=post&s=view&id=1", null]
    ])("names the page %s", (query, name) => {
      visit(query);

      expect(new Rule34Document().readPageName()).toBe(name);
    });
  });

  describe("readFavoritesOwnerId", () => {
    test("reads the viewed favorites page id, empty when absent", () => {
      visit("page=favorites&id=123");
      expect(new Rule34Document().readFavoritesOwnerId()).toBe("123");

      visit("page=favorites");
      expect(new Rule34Document().readFavoritesOwnerId()).toBe("");
    });
  });

  describe("isFirstFavoritesPage", () => {
    test.each([
      ["page=favorites&id=1", true],
      ["page=favorites&id=1&pid=0", true],
      ["page=favorites&id=1&pid=50", false],
      ["page=post&s=list", false]
    ])("tells whether the browser opened the first favorites page (%s)", (query, first) => {
      visit(query);

      expect(new Rule34Document().isFirstFavoritesPage()).toBe(first);
    });
  });

  describe("readSearchQuery", () => {
    test("reads the decoded search query, empty when absent", () => {
      visit("page=post&s=list&tags=apple+banana%3A");
      expect(new Rule34Document().readSearchQuery()).toBe("apple banana:");

      visit("page=post&s=list");
      expect(new Rule34Document().readSearchQuery()).toBe("");
    });
  });

  describe("readPostListPageIndex", () => {
    test.each([
      ["page=post&s=list&pid=84", 2],
      ["page=post&s=list", 0],
      ["page=post&s=list&pid=-42", 0],
      ["page=post&s=list&pid=abc", 0]
    ])("reads the opened page of a search, 0 when the offset is absent or invalid (%s)", (query, pageIndex) => {
      visit(query);

      expect(new Rule34Document().readPostListPageIndex()).toBe(pageIndex);
    });
  });

  describe("readUserId", () => {
    test("reads the logged-in user, or nothing when logged out", () => {
      visit("page=post&s=list", "theme=dark; user_id=9");
      expect(new Rule34Document().readUserId()).toBe("9");

      visit("page=post&s=list");
      expect(new Rule34Document().readUserId()).toBe("");
    });
  });

  describe("readColorScheme", () => {
    test("reads the color scheme from the site's theme cookie", () => {
      visit("page=favorites&id=1", "theme=dark");

      expect(new Rule34Document().readColorScheme()).toBe("dark");
    });

    test("reads light without a dark theme cookie", () => {
      visit("page=favorites&id=1");

      expect(new Rule34Document().readColorScheme()).toBe("light");
    });
  });

  describe("readTagBlacklist", () => {
    test.each([
      ["", []],
      ["%20%20apple%09banana%0A%20", ["apple", "banana"]],
      ["apple*", ["apple*"]]
    ])("splits decoded blacklist %s into tags", (cookie, expected) => {
      visit("page=favorites&id=1", `tag_blacklist=${cookie}`);

      expect(new Rule34Document().readTagBlacklist()).toEqual(expected);
    });

    test("reads the decoded tag blacklist from the site's cookie", () => {
      visit("page=favorites&id=1", "tag_blacklist=apple%2520banana");

      expect(new Rule34Document().readTagBlacklist()).toEqual(["apple", "banana"]);
    });
  });

  describe("setColorScheme", () => {
    afterEach(() => {
      document.cookie = "theme=; max-age=0; path=/";
    });

    test.each<[ColorScheme, string]>([
      ["dark", "theme=dark"],
      ["light", "theme=light"]
    ])("remembers the color scheme in the site's cookie (%s)", (colorScheme, cookie) => {
      new Rule34Document().setColorScheme(colorScheme);
      expect(document.cookie).toContain(cookie);
    });

    test.each<[string, ColorScheme, string]>([
      ["https://rule34.xxx//css/desktop.css?46", "dark", "https://rule34.xxx//css/desktop-dark.css?46"],
      ["https://rule34.xxx//css/desktop-dark.css?46", "light", "https://rule34.xxx//css/desktop.css?46"],
      ["https://rule34.xxx//css/mobile.css?46", "dark", "https://rule34.xxx//css/mobile-dark.css?46"]
    ])("swaps the site's stylesheet %s to %s", (href, colorScheme, swappedHref) => {
      const stylesheet = addStylesheet(href);

      new Rule34Document().setColorScheme(colorScheme);
      expect(stylesheet.getAttribute("href")).toBe(swappedHref);
    });

    test("leaves a stylesheet already in the color scheme untouched, so it isn't reloaded", () => {
      const stylesheet = addStylesheet("https://rule34.xxx//css/desktop-dark.css?46");
      const observer = new MutationObserver(() => { });

      observer.observe(stylesheet, { attributes: true });
      new Rule34Document().setColorScheme("dark");
      expect(observer.takeRecords()).toEqual([]);
      observer.disconnect();
    });

    test("recolors the site's header for the new color scheme", () => {
      const header = addHeader();
      const rule34Document = new Rule34Document();

      rule34Document.setTheme(THEME_DEFINITIONS.cherry);
      rule34Document.setColorScheme("dark");
      expect(readHeaderColors(header)).toEqual(readExpectedColors(THEME_DEFINITIONS.cherry.darkColors));
    });
  });

  describe("setTheme", () => {
    afterEach(() => {
      document.cookie = "theme=; max-age=0; path=/";
    });

    test("colors the site's header with the theme for the site's color scheme", () => {
      const header = addHeader();

      document.cookie = "theme=dark; path=/";
      new Rule34Document().setTheme(THEME_DEFINITIONS.frost);
      expect(readHeaderColors(header)).toEqual(readExpectedColors(THEME_DEFINITIONS.frost.darkColors));
    });

    test("colors the rest of the site through the site's color variables", () => {
      const sidebar = document.createElement("div");
      const { text, accent } = THEME_DEFINITIONS.frost.lightColors;

      document.body.append(sidebar);
      new Rule34Document().setTheme(THEME_DEFINITIONS.frost);
      expect([readSiteColor(sidebar, "--c-text"), readSiteColor(sidebar, "--c-link")]).toEqual([text, accent]);
    });

    test("replaces the previous theme instead of stacking another", () => {
      const header = addHeader();
      const rule34Document = new Rule34Document();

      rule34Document.setTheme(THEME_DEFINITIONS.frost);
      rule34Document.setTheme(THEME_DEFINITIONS.cherry);
      expect(readHeaderColors(header)).toEqual(readExpectedColors(THEME_DEFINITIONS.cherry.lightColors));
      expect(document.head.querySelectorAll("style")).toHaveLength(1);
    });

    test("leaves the site's own look alone for the rule34 theme", () => {
      const sidebar = document.createElement("div");
      const rule34Document = new Rule34Document();

      document.body.append(sidebar);
      rule34Document.setTheme(THEME_DEFINITIONS.frost);
      rule34Document.setTheme(THEME_DEFINITIONS.rule34);
      expect(readSiteColor(sidebar, "--c-text")).toBe("");
    });
  });

  describe("setHeaderVisible", () => {
    test("hides the site's header, then shows it again", () => {
      const header = addHeader();
      const rule34Document = new Rule34Document();

      rule34Document.setHeaderVisible(false);
      expect(header.style.display).toBe("none");
      rule34Document.setHeaderVisible(true);
      expect(header.style.display).toBe("");
    });

    test("does nothing when the page has no header", () => {
      expect(() => new Rule34Document().setHeaderVisible(false)).not.toThrow();
    });
  });

  describe("setPaginatorVisible", () => {
    test("hides the paginator, then shows it again", () => {
      const paginator = addPaginator("1");
      const rule34Document = new Rule34Document();

      rule34Document.setPaginatorVisible(false);
      expect(paginator.style.display).toBe("none");
      rule34Document.setPaginatorVisible(true);
      expect(paginator.style.display).toBe("");
    });

    test("skips a page without a paginator", () => {
      expect(() => new Rule34Document().setPaginatorVisible(false)).not.toThrow();
    });
  });

  describe("reflectPostListPage", () => {
    test("reflects a kept page on the paginator and address, then the opened page again", () => {
      const rule34Document = new Rule34Document();

      openSearch();
      rule34Document.keepPaginator(0, addPaginator("landing"));
      rule34Document.keepPaginator(2, createPaginator("fetched"));
      rule34Document.reflectPostListPage(2);
      expect([readPaginatorText(), readAddressOffset()]).toEqual(["fetched", "84"]);
      rule34Document.reflectPostListPage(0);
      expect([readPaginatorText(), readAddressOffset()]).toEqual(["landing", "0"]);
    });

    test("keeps the paginator hidden when it swaps one in", () => {
      const rule34Document = new Rule34Document();
      const fetched = createPaginator("fetched");

      openSearch();
      addPaginator("landing");
      rule34Document.setPaginatorVisible(false);
      rule34Document.keepPaginator(2, fetched);
      rule34Document.reflectPostListPage(2);
      expect(fetched.style.display).toBe("none");
    });

    test("still rewrites the address for a page whose paginator it never kept", () => {
      const rule34Document = new Rule34Document();

      openSearch();
      addPaginator("landing");
      rule34Document.keepPaginator(3, null);
      rule34Document.reflectPostListPage(5);
      expect([readPaginatorText(), readAddressOffset()]).toEqual(["landing", "210"]);
    });

    test("leaves the page alone when it has no paginator", () => {
      const rule34Document = new Rule34Document();

      openSearch();
      rule34Document.keepPaginator(2, createPaginator("fetched"));
      rule34Document.reflectPostListPage(2);
      expect(readPaginatorText()).toBeUndefined();
    });
  });

  describe("clearNativePage", () => {
    test("removes the page's favorites and strips their attributes", () => {
      const content = addContent("1", "2");

      new Rule34Document().clearNativePage();
      expect(content.isConnected).toBe(false);
      expect(content.attributes).toHaveLength(0);
    });

    test("removes the margin below the site's header", () => {
      const header = addHeader();

      new Rule34Document().clearNativePage();
      expect(header.style.marginBottom).toBe("0px");
    });

    test("does nothing to content when the page has none", () => {
      expect(() => new Rule34Document().clearNativePage()).not.toThrow();
    });

    test("removes the site's player and autocomplete scripts, keeping the rest", () => {
      const player = addScript("https://example.com/fluidplayer.min.js");
      const autocomplete = addScript("https://example.com/awesomplete.js");
      const other = addScript("https://example.com/cherry.js");

      new Rule34Document().clearNativePage();
      expect([player, autocomplete, other].map(script => script.isConnected)).toEqual([false, false, true]);
    });

    test("releases the globals those scripts left behind", () => {
      globals.fluidPlayer = {};
      globals.Awesomplete = {};

      new Rule34Document().clearNativePage();
      expect(["fluidPlayer", "Awesomplete"].filter(name => name in globals)).toEqual([]);
    });

    test("logs a global it can't release and carries on", () => {
      const logged = vi.spyOn(console, "error").mockImplementation(() => { });

      Object.defineProperty(window, "dashjs", { value: {}, configurable: false });
      globals.captchaProvider = {};
      new Rule34Document().clearNativePage();
      expect(logged).toHaveBeenCalledOnce();
      expect("captchaProvider" in globals).toBe(false);
    });
  });

  describe("claimPostListContent", () => {
    test("replaces everything in the post list but the sidebar and paginator with an empty element", () => {
      const postList = addPostList("1", "2");
      const [sidebar, native, paginator] = [...postList.children];
      const claimed = new Rule34Document().claimPostListContent();
      const content = claimed?.parentElement;

      expect([...postList.children]).toEqual([sidebar, content]);
      expect(content?.className).toBe("content");
      expect(content?.style.flexGrow).toBe("1");
      expect([...content?.children ?? []]).toEqual([claimed, paginator]);
      expect(claimed?.childElementCount).toBe(0);
      expect([native.isConnected, native.attributes.length]).toEqual([false, 0]);
    });

    test("keeps a paginator nested in the native content", () => {
      const postList = addPostList("1");
      const paginator = postList.querySelector("#paginator");

      postList.querySelector(".content")?.append(paginator as HTMLElement);
      const claimed = new Rule34Document().claimPostListContent();

      expect(claimed?.nextElementSibling).toBe(paginator);
    });

    test("claims nothing when the page has no post list", () => {
      expect(new Rule34Document().claimPostListContent()).toBeNull();
    });
  });
});
