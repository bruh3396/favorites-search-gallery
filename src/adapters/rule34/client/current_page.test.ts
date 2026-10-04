import * as CurrentPage from "@/adapters/rule34/client/current_page";
import { afterEach, describe, expect, test, vi } from "vitest";
import { ColorScheme } from "@/core/boundary/environment";

const globals = window as unknown as Record<string, unknown>;

function visit(query: string, cookie = ""): void {
  vi.stubGlobal("location", { href: `https://rule34.xxx/index.php?${query}` });
  vi.stubGlobal("document", { cookie, querySelectorAll: () => [] });
}

function addHeader(): HTMLElement {
  const header = document.createElement("div");

  header.id = "header";
  document.body.append(header);
  return header;
}

function addPaginator(text: string): HTMLElement {
  const paginator = document.createElement("div");

  paginator.id = "paginator";
  paginator.textContent = text;
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

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.head.replaceChildren();
  document.body.replaceChildren();
});

describe("readPageName", () => {
  test.each([
    ["page=favorites&s=view&id=1", "favorites"],
    ["page=post&s=list&tags=apple", "postList"],
    ["page=post&s=view&id=1", null]
  ])("names the page %s", (query, name) => {
    visit(query);

    expect(CurrentPage.readPageName()).toBe(name);
  });
});

describe("readFavoritesPageId", () => {
  test("reads the viewed favorites page id, empty when absent", () => {
    visit("page=favorites&id=123");
    expect(CurrentPage.readFavoritesPageId()).toBe("123");

    visit("page=favorites");
    expect(CurrentPage.readFavoritesPageId()).toBe("");
  });
});

describe("readFirstFavoritesPage", () => {
  test.each([
    ["page=favorites&id=1", true],
    ["page=favorites&id=1&pid=0", true],
    ["page=favorites&id=1&pid=50", false],
    ["page=post&s=list", false]
  ])("reads the favorites on the page only on the first favorites page (%s)", (query, read) => {
    visit(query);

    expect(CurrentPage.readFirstFavoritesPage(() => null) !== null).toBe(read);
  });
});

describe("readSearchQuery", () => {
  test("reads the decoded search query, empty when absent", () => {
    visit("page=post&s=list&tags=apple+banana%3A");
    expect(CurrentPage.readSearchQuery()).toBe("apple banana:");

    visit("page=post&s=list");
    expect(CurrentPage.readSearchQuery()).toBe("");
  });
});

describe("readPageOffset", () => {
  test.each([
    ["page=post&s=list&pid=84", 84],
    ["page=post&s=list", 0],
    ["page=post&s=list&pid=-42", 0],
    ["page=post&s=list&pid=abc", 0]
  ])("reads the page's post offset, 0 when absent or invalid (%s)", (query, offset) => {
    visit(query);

    expect(CurrentPage.readPageOffset()).toBe(offset);
  });
});

describe("readUserId", () => {
  test("reads the logged-in user, or nothing when logged out", () => {
    visit("page=post&s=list", "theme=dark; user_id=9");
    expect(CurrentPage.readUserId()).toBe("9");

    visit("page=post&s=list");
    expect(CurrentPage.readUserId()).toBe("");
  });
});

describe("readTheme", () => {
  test("reads the theme from the site's cookie", () => {
    visit("page=favorites&id=1", "theme=dark");

    expect(CurrentPage.readTheme()).toBe("dark");
  });
});

describe("readTagBlacklist", () => {
  test("reads the decoded tag blacklist from the site's cookie", () => {
    visit("page=favorites&id=1", "tag_blacklist=apple%2520banana");

    expect(CurrentPage.readTagBlacklist()).toBe("apple banana");
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
    CurrentPage.setTheme(colorScheme);
    expect(document.cookie).toContain(cookie);
  });
});

describe("setHeaderVisible", () => {
  test("hides the site's header, then shows it again", () => {
    const header = addHeader();

    CurrentPage.setHeaderVisible(false);
    expect(header.style.display).toBe("none");
    CurrentPage.setHeaderVisible(true);
    expect(header.style.display).toBe("");
  });

  test("does nothing when the page has no header", () => {
    expect(() => CurrentPage.setHeaderVisible(false)).not.toThrow();
  });
});

describe("setPageOffset", () => {
  test("rewrites the address's post offset without loading a page", () => {
    const replaceState = vi.fn<History["replaceState"]>();

    vi.stubGlobal("location", { href: "https://rule34.xxx/index.php?page=post&s=list&tags=apple&pid=42" });
    vi.stubGlobal("history", { replaceState });
    CurrentPage.setPageOffset(84);
    expect(String(replaceState.mock.calls[0][2])).toBe("https://rule34.xxx/index.php?page=post&s=list&tags=apple&pid=84");
  });
});

describe("replacePaginator", () => {
  test("puts another page's paginator in place of the current one, keeping it hidden", () => {
    const current = addPaginator("1");
    const next = document.createElement("div");

    next.id = "paginator";
    CurrentPage.setPaginatorVisible(false);
    CurrentPage.replacePaginator(next);
    expect(current.isConnected).toBe(false);
    expect(next.isConnected).toBe(true);
    expect(next.style.display).toBe("none");
  });

  test("leaves the page alone when it has no paginator or the paginator is already shown", () => {
    const paginator = addPaginator("1");

    CurrentPage.replacePaginator(paginator);
    expect(paginator.isConnected).toBe(true);
    paginator.remove();
    expect(() => {
      CurrentPage.replacePaginator(paginator);
      CurrentPage.setPaginatorVisible(false);
    }).not.toThrow();
  });
});

describe("setPaginatorVisible", () => {
  test("hides the paginator, then shows it again", () => {
    const paginator = addPaginator("1");

    CurrentPage.setPaginatorVisible(false);
    expect(paginator.style.display).toBe("none");
    CurrentPage.setPaginatorVisible(true);
    expect(paginator.style.display).toBe("");
  });
});

describe("clearNativePage", () => {
  test("removes the page's favorites and strips their attributes", () => {
    const content = addContent("1", "2");

    CurrentPage.clearNativePage();
    expect(content.isConnected).toBe(false);
    expect(content.attributes).toHaveLength(0);
  });

  test("does nothing to content when the page has none", () => {
    expect(() => CurrentPage.clearNativePage()).not.toThrow();
  });

  test("removes the site's player and autocomplete scripts, keeping the rest", () => {
    const player = addScript("https://example.com/fluidplayer.min.js");
    const autocomplete = addScript("https://example.com/awesomplete.js");
    const other = addScript("https://example.com/cherry.js");

    CurrentPage.clearNativePage();
    expect([player, autocomplete, other].map(script => script.isConnected)).toEqual([false, false, true]);
  });

  test("releases the globals those scripts left behind", () => {
    globals.fluidPlayer = {};
    globals.Awesomplete = {};

    CurrentPage.clearNativePage();
    expect(["fluidPlayer", "Awesomplete"].filter(name => name in globals)).toEqual([]);
  });

  test("logs a global it can't release and carries on", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => { });

    Object.defineProperty(window, "dashjs", { value: {}, configurable: false });
    globals.captchaProvider = {};
    CurrentPage.clearNativePage();
    expect(logged).toHaveBeenCalledOnce();
    expect("captchaProvider" in globals).toBe(false);
  });
});
