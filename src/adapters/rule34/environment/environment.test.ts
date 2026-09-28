import { afterEach, describe, expect, test, vi } from "vitest";
import { readRule34Environment, readRule34UserId } from "@/adapters/rule34/environment/environment";

function visit(query: string, cookie = ""): void {
  vi.stubGlobal("location", { href: `https://rule34.xxx/index.php?${query}` });
  vi.stubGlobal("document", { cookie });
}

describe("readRule34Environment", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("runs in favorites mode on a favorites page, keyed by the viewed page", () => {
    visit("page=favorites&s=view&id=123", "user_id=9");

    expect(readRule34Environment()).toMatchObject({ mode: "favorites", favoritesId: "123", ownsFavorites: false });
  });

  test("owns the favorites on the viewer's own favorites page", () => {
    visit("page=favorites&s=view&id=9", "user_id=9");

    expect(readRule34Environment()?.ownsFavorites).toBe(true);
  });

  test("runs in posts mode on a post list, keyed by the logged-in user", () => {
    visit("page=post&s=list&tags=apple", "user_id=9");

    expect(readRule34Environment()).toMatchObject({ mode: "posts", favoritesId: "9", ownsFavorites: false });
  });

  test("never owns the favorites on a post list, even logged out", () => {
    visit("page=post&s=list");

    expect(readRule34Environment()?.ownsFavorites).toBe(false);
  });

  test("gives nothing on a page the app doesn't run on", () => {
    visit("page=post&s=view&id=1");

    expect(readRule34Environment()).toBeNull();
  });

  test("reads the tag blacklist and theme from cookies", () => {
    visit("page=favorites&id=1", "theme=dark; tag_blacklist=apple%2520banana");

    expect(readRule34Environment()).toMatchObject({ usingDarkMode: true, blacklistedTags: "apple banana" });
  });
});

describe("readRule34UserId", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("reads the logged-in user, or nothing when logged out", () => {
    visit("page=post&s=list", "theme=dark; user_id=9");
    expect(readRule34UserId()).toBe("9");

    visit("page=post&s=list");
    expect(readRule34UserId()).toBe("");
  });
});
