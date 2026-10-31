import { createPost, createPosts } from "@/testing/post";
import { describe, expect, test } from "vitest";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { StringInterner } from "@/core/utils/string/string_interner";

function getPostIds(favorites: { id: string }[]): string[] {
  return favorites.map(favorite => favorite.id);
}

describe("FavoritesCollection", () => {
  describe("append", () => {
    test("adds favorites to the end", () => {
      const favoritesCollection = new FavoritesCollection(new StringInterner());

      favoritesCollection.append(createPosts("1", "2"));
      favoritesCollection.append(createPosts("3"));
      expect(getPostIds(favoritesCollection.getAll())).toEqual(["1", "2", "3"]);
    });
  });

  describe("prependAsNew", () => {
    test("adds favorites to the front marked as new", () => {
      const favoritesCollection = new FavoritesCollection(new StringInterner());

      favoritesCollection.append(createPosts("1", "2"));
      favoritesCollection.prependAsNew(createPosts("3"));
      expect(favoritesCollection.getAll().map(arenaFavorite => [arenaFavorite.id, arenaFavorite.isNew])).toEqual([["3", true], ["1", false], ["2", false]]);
    });

    test("moves a favorite it already holds to the front as new", () => {
      const favoritesCollection = new FavoritesCollection(new StringInterner());

      const [, existingArenaFavorite] = favoritesCollection.append(createPosts("1", "2"));
      const [prependedArenaFavorite] = favoritesCollection.prependAsNew(createPosts("2"));

      expect(prependedArenaFavorite).toBe(existingArenaFavorite);
      expect(favoritesCollection.getAll().map(arenaFavorite => [arenaFavorite.id, arenaFavorite.isNew])).toEqual([["2", true], ["1", false]]);
    });
  });

  describe("size", () => {
    test("counts the favorites", () => {
      const favoritesCollection = new FavoritesCollection(new StringInterner());

      favoritesCollection.append(createPosts("1", "2"));
      favoritesCollection.prependAsNew(createPosts("3"));
      expect(favoritesCollection.size).toBe(3);
    });
  });

  describe("slice", () => {
    test("returns the favorites in the given range", () => {
      const favoritesCollection = new FavoritesCollection(new StringInterner());

      favoritesCollection.append(createPosts("1", "2", "3", "4"));
      expect(getPostIds(favoritesCollection.slice(1, 3))).toEqual(["2", "3"]);
    });
  });

  describe("overwrite", () => {
    test("returns undefined for a post that is not in the collection", () => {
      const favoritesCollection = new FavoritesCollection(new StringInterner());

      favoritesCollection.append(createPosts("1"));
      expect(favoritesCollection.overwrite(createPost({ id: "2" }))).toBeUndefined();
    });

    test("overwrites the favorite's post", () => {
      const favoritesCollection = new FavoritesCollection(new StringInterner());
      const [arenaFavorite] = favoritesCollection.append([createPost({ id: "1", score: 1 })]);

      favoritesCollection.overwrite(createPost({ id: "1", score: 500 }));
      expect(arenaFavorite.getMetric("score")).toBe(500);
    });

    test("returns the favorite with the tags it had before", () => {
      const favoritesCollection = new FavoritesCollection(new StringInterner());
      const [arenaFavorite] = favoritesCollection.append([createPost({ id: "1", tags: "apple" })]);

      expect(favoritesCollection.overwrite(createPost({ id: "1", tags: "banana" }))).toEqual({ favorite: arenaFavorite, previousTags: new Set(["apple"]) });
      expect(arenaFavorite.tags).toEqual(new Set(["banana"]));
    });

    test("announces a favorite each time it gains media", () => {
      const favoritesCollection = new FavoritesCollection(new StringInterner());
      const [firstArenaFavorite, secondArenaFavorite] = favoritesCollection.append(createPosts("1", "2"));
      const announcedFavorites: Favorite[] = [];

      favoritesCollection.hydrated.on(favorite => announcedFavorites.push(favorite));
      favoritesCollection.overwrite(createPost({ id: "1", media: { kind: "image", locator: "1/a" } }));
      favoritesCollection.overwrite(createPost({ id: "2", media: { kind: "image", locator: "2/a" } }));
      expect(announcedFavorites).toEqual([firstArenaFavorite, secondArenaFavorite]);
    });

    test("announces nothing when the media was already known", () => {
      const favoritesCollection = new FavoritesCollection(new StringInterner());
      const announcedFavorites: Favorite[] = [];

      favoritesCollection.append([createPost({ id: "1", media: { kind: "image", locator: "1/a" } })]);
      favoritesCollection.hydrated.on(favorite => announcedFavorites.push(favorite));
      favoritesCollection.overwrite(createPost({ id: "1", media: { kind: "image", locator: "1/b" } }));
      expect(announcedFavorites).toEqual([]);
    });
  });

  describe("compact", () => {
    test("keeps every favorite readable", () => {
      const favoritesCollection = new FavoritesCollection(new StringInterner());
      const [arenaFavorite] = favoritesCollection.append([createPost({ id: "1", tags: "apple" })]);

      favoritesCollection.compact();
      expect(arenaFavorite.tags).toEqual(new Set(["apple"]));
    });
  });
});
