import { afterEach, describe, expect, test, vi } from "vitest";
import { ColorScheme } from "@/core/boundary/environment";
import { Rule34Document } from "@/adapters/rule34/document/document";

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

function createThumb(id: string): string {
  const image = `<img src="https://example.com/${id}.jpg" title="apple banana">`;
  return `<span class="thumb" id="s${id}"><a id="p${id}">${image}</a></span>`;
}

function addContent(...ids: string[]): HTMLElement {
  const content = document.createElement("div");

  content.id = "content";
  content.innerHTML = ids.map(createThumb).join("");
  document.body.append(content);
  return content;
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

  describe("readFavoritesPageId", () => {
    test("reads the viewed favorites page id, empty when absent", () => {
      visit("page=favorites&id=123");
      expect(new Rule34Document().readFavoritesPageId()).toBe("123");

      visit("page=favorites");
      expect(new Rule34Document().readFavoritesPageId()).toBe("");
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

  describe("readTheme", () => {
    test("reads the theme from the site's cookie", () => {
      visit("page=favorites&id=1", "theme=dark");

      expect(new Rule34Document().readTheme()).toBe("dark");
    });
  });

  describe("readTagBlacklist", () => {
    test("reads the decoded tag blacklist from the site's cookie", () => {
      visit("page=favorites&id=1", "tag_blacklist=apple%2520banana");

      expect(new Rule34Document().readTagBlacklist()).toBe("apple banana");
    });
  });

  describe("setTheme", () => {
    afterEach(() => {
      document.cookie = "theme=; max-age=0; path=/";
    });

    test.each<[ColorScheme, string]>([
      ["dark", "theme=dark"],
      ["light", "theme=light"]
    ])("remembers the theme in the site's cookie (%s)", (colorScheme, cookie) => {
      new Rule34Document().setTheme(colorScheme);
      expect(document.cookie).toContain(cookie);
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
});
