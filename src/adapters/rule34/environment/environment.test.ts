import { describe, expect, test } from "vitest";
import { PageName } from "@/adapters/rule34/client/site/current_page/current_page";
import { readRule34Environment } from "@/adapters/rule34/environment/environment";

interface Visit {
  pageName: PageName | null;
  favoritesPageId?: string;
  userId?: string;
  theme?: string;
  tagBlacklist?: string;
}

function createClient({ pageName, favoritesPageId = "", userId = "", theme = "", tagBlacklist = "" }: Visit): Parameters<typeof readRule34Environment>[0] {
  return {
    readPageName: () => pageName,
    readFavoritesPageId: () => favoritesPageId,
    readUserId: () => userId,
    readTheme: () => theme,
    readTagBlacklist: () => tagBlacklist
  };
}

describe("readRule34Environment", () => {
  test("runs in favorites mode on a favorites page, keyed by the viewed page", () => {
    expect(readRule34Environment(createClient({ pageName: "favorites", favoritesPageId: "123", userId: "9" })))
      .toMatchObject({ mode: "favorites", favoritesOwnerId: "123", ownsFavorites: false });
  });

  test("owns the favorites on the viewer's own favorites page", () => {
    expect(readRule34Environment(createClient({ pageName: "favorites", favoritesPageId: "9", userId: "9" }))?.ownsFavorites).toBe(true);
  });

  test("runs in posts mode on a post list, keyed by the logged-in user", () => {
    expect(readRule34Environment(createClient({ pageName: "postList", userId: "9" })))
      .toMatchObject({ mode: "postList", favoritesOwnerId: "9", ownsFavorites: false });
  });

  test("never owns the favorites on a post list, even logged out", () => {
    expect(readRule34Environment(createClient({ pageName: "postList" }))?.ownsFavorites).toBe(false);
  });

  test("gives nothing on a page the app doesn't run on", () => {
    expect(readRule34Environment(createClient({ pageName: null }))).toBeNull();
  });

  test("reads the tag blacklist and dark theme", () => {
    expect(readRule34Environment(createClient({ pageName: "favorites", theme: "dark", tagBlacklist: "apple banana" })))
      .toMatchObject({ darkTheme: true, blacklistedTags: "apple banana" });
  });
});
