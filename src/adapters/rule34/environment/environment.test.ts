import { describe, expect, test } from "vitest";
import { ColorScheme } from "@/core/boundary/environment";
import { Rule34PageName } from "@/adapters/rule34/document/document";
import { readRule34Environment } from "@/adapters/rule34/environment/environment";

interface Visit {
  pageName: Rule34PageName | null;
  favoritesPageId?: string;
  userId?: string;
  theme?: ColorScheme;
  tagBlacklist?: string;
}

function createRule34Document(visit: Visit): Parameters<typeof readRule34Environment>[0] {
  const { pageName, favoritesPageId = "", userId = "", theme = "light", tagBlacklist = "" } = visit;
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
    expect(readRule34Environment(createRule34Document({ pageName: "favorites", favoritesPageId: "123", userId: "9" })))
      .toMatchObject({ mode: "favorites", favoritesOwnerId: "123", ownsFavorites: false });
  });

  test("owns the favorites on the viewer's own favorites page", () => {
    const rule34Document = createRule34Document({ pageName: "favorites", favoritesPageId: "9", userId: "9" });

    expect(readRule34Environment(rule34Document)?.ownsFavorites).toBe(true);
  });

  test("runs in posts mode on a post list, keyed by the logged-in user", () => {
    expect(readRule34Environment(createRule34Document({ pageName: "postList", userId: "9" })))
      .toMatchObject({ mode: "postList", favoritesOwnerId: "9", ownsFavorites: false });
  });

  test("never owns the favorites on a post list, even logged out", () => {
    expect(readRule34Environment(createRule34Document({ pageName: "postList" }))?.ownsFavorites).toBe(false);
  });

  test("gives nothing on a page the app doesn't run on", () => {
    expect(readRule34Environment(createRule34Document({ pageName: null }))).toBeNull();
  });

  test("reads the tag blacklist and the site's theme", () => {
    expect(readRule34Environment(createRule34Document({ pageName: "favorites", theme: "dark", tagBlacklist: "apple banana" })))
      .toMatchObject({ colorScheme: "dark", blacklistedTags: "apple banana" });
  });
});
