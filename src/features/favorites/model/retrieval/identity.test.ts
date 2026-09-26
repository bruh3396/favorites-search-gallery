import { describe, expect, test } from "vitest";
import { favoritesDatabaseKey, favoritesPageId } from "@/features/favorites/model/retrieval/identity";

describe("favoritesPageId", () => {
  test("returns the page id from the url", () => {
    expect(favoritesPageId({ onFavoritesPage: true, favoritesPageId: "123", userId: "9" })).toBe("123");
  });

  test("falls back to an empty string when the url has no id", () => {
    expect(favoritesPageId({ onFavoritesPage: true, favoritesPageId: null, userId: "9" })).toBe("");
  });
});

describe("favoritesDatabaseKey", () => {
  test("keys by the viewed favorites page on a favorites page", () => {
    expect(favoritesDatabaseKey({ onFavoritesPage: true, favoritesPageId: "123", userId: "9" })).toBe("user123");
  });

  test("keys by the logged-in user off a favorites page", () => {
    expect(favoritesDatabaseKey({ onFavoritesPage: false, favoritesPageId: "123", userId: "9" })).toBe("user9");
  });

  test("keys by an empty id on a favorites page without an id", () => {
    expect(favoritesDatabaseKey({ onFavoritesPage: true, favoritesPageId: null, userId: "9" })).toBe("user");
  });
});
