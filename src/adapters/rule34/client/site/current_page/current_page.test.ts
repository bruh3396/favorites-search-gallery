import * as CurrentPage from "@/adapters/rule34/client/site/current_page/current_page";
import { afterEach, describe, expect, test, vi } from "vitest";

function visit(query: string, cookie = ""): void {
  vi.stubGlobal("location", { href: `https://rule34.xxx/index.php?${query}` });
  vi.stubGlobal("document", { cookie, querySelectorAll: () => [] });
}

describe("current page", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test.each([
    ["page=favorites&s=view&id=1", "favorites"],
    ["page=post&s=list&tags=apple", "postList"],
    ["page=post&s=view&id=1", null]
  ])("names the page %s", (query, name) => {
    visit(query);

    expect(CurrentPage.readPageName()).toBe(name);
  });

  test("reads the viewed favorites page id, empty when absent", () => {
    visit("page=favorites&id=123");
    expect(CurrentPage.readFavoritesPageId()).toBe("123");

    visit("page=favorites");
    expect(CurrentPage.readFavoritesPageId()).toBe("");
  });

  test.each([
    ["page=favorites&id=1", true],
    ["page=favorites&id=1&pid=0", true],
    ["page=favorites&id=1&pid=50", false],
    ["page=post&s=list", false]
  ])("reads the favorites on the page only on the first favorites page (%s)", (query, read) => {
    visit(query);

    expect(CurrentPage.readFirstFavoritesPage() !== null).toBe(read);
  });

  test("reads the logged-in user, or nothing when logged out", () => {
    visit("page=post&s=list", "theme=dark; user_id=9");
    expect(CurrentPage.readUserId()).toBe("9");

    visit("page=post&s=list");
    expect(CurrentPage.readUserId()).toBe("");
  });

  test("reads the theme and the decoded tag blacklist", () => {
    visit("page=favorites&id=1", "theme=dark; tag_blacklist=apple%2520banana");

    expect(CurrentPage.readTheme()).toBe("dark");
    expect(CurrentPage.readTagBlacklist()).toBe("apple banana");
  });
});
