import { createPost, createPosts } from "@/testing/post";
import { describe, expect, test } from "vitest";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { FavoritesCollection } from "@/core/features/favorites/model/collection/collection";
import { RATINGS } from "@/core/domain/post/post";

function getIds(favorites: { id: string }[]): string[] {
  return favorites.map(favorite => favorite.id);
}

describe("FavoritesCollection", () => {
  describe("append", () => {
    test("adds favorites to the end", () => {
      const collection = new FavoritesCollection();

      collection.append(createPosts("1", "2"));
      collection.append(createPosts("3"));
      expect(getIds(collection.getAll())).toEqual(["1", "2", "3"]);
    });
  });

  describe("prependAsNew", () => {
    test("adds favorites to the front marked as new", () => {
      const collection = new FavoritesCollection();

      collection.append(createPosts("1", "2"));
      collection.prependAsNew(createPosts("3"));
      expect(collection.getAll().map(favorite => [favorite.id, favorite.isNew])).toEqual([["3", true], ["1", false], ["2", false]]);
    });

    test("moves a favorite it already holds to the front as new", () => {
      const collection = new FavoritesCollection();

      collection.append(createPosts("1", "2"));
      const [prepended] = collection.prependAsNew(createPosts("2"));

      expect(prepended).toBe(collection.findFavorite("2"));
      expect(collection.getAll().map(favorite => [favorite.id, favorite.isNew])).toEqual([["2", true], ["1", false]]);
    });
  });

  describe("findPost", () => {
    test("returns the favorite's post", () => {
      const collection = new FavoritesCollection();
      const post = createPost({ id: "1", tags: "apple", score: 5 });

      collection.append([post]);
      expect(collection.findPost("1")).toEqual(post);
    });

    test("returns undefined for an id that is not in the collection", () => {
      expect(new FavoritesCollection().findPost("1")).toBeUndefined();
    });
  });

  describe("getRating", () => {
    test.each(RATINGS)("reads a %s rating", rating => {
      const collection = new FavoritesCollection();

      collection.append([createPost({ id: "1", rating })]);
      expect(collection.getRating("1")).toBe(rating);
    });

    test("throws for an id that is not in the collection", () => {
      expect(() => new FavoritesCollection().getRating("1")).toThrow();
    });
  });

  describe("overwrite", () => {
    test("returns undefined for a post that is not in the collection", () => {
      const collection = new FavoritesCollection();

      collection.append(createPosts("1"));
      expect(collection.overwrite(createPost({ id: "2" }))).toBeUndefined();
    });

    test("overwrites the favorite's post", () => {
      const collection = new FavoritesCollection();
      const [favorite] = collection.append([createPost({ id: "1", score: 1 })]);

      collection.overwrite(createPost({ id: "1", score: 500 }));
      expect(favorite.getMetric("score")).toBe(500);
    });

    test("reports the term update when the tags changed", () => {
      const collection = new FavoritesCollection();
      const [favorite] = collection.append([createPost({ id: "1", tags: "apple" })]);

      expect(collection.overwrite(createPost({ id: "1", tags: "banana" }))).toEqual({
        doc: favorite,
        oldTerms: new Set(["apple"]),
        newTerms: new Set(["banana"])
      });
      expect(favorite.tags).toEqual(new Set(["banana"]));
    });

    test("reports no term update when the tags are unchanged", () => {
      const collection = new FavoritesCollection();

      collection.append([createPost({ id: "1", tags: "apple" })]);
      expect(collection.overwrite(createPost({ id: "1", tags: "apple", score: 5 }))).toBeUndefined();
    });

    test("announces a favorite each time it gains media", () => {
      const collection = new FavoritesCollection();
      const [first, second] = collection.append(createPosts("1", "2"));
      const announced: Favorite[] = [];

      collection.hydrated.on(favorite => announced.push(favorite));
      collection.overwrite(createPost({ id: "1", media: { kind: "image", locator: "1/a" } }));
      collection.overwrite(createPost({ id: "2", media: { kind: "image", locator: "2/a" } }));
      expect(announced).toEqual([first, second]);
    });

    test("announces nothing when the media was already known", () => {
      const collection = new FavoritesCollection();
      const announced: Favorite[] = [];

      collection.append([createPost({ id: "1", media: { kind: "image", locator: "1/a" } })]);
      collection.hydrated.on(favorite => announced.push(favorite));
      collection.overwrite(createPost({ id: "1", media: { kind: "image", locator: "1/b" } }));
      expect(announced).toEqual([]);
    });
  });

  describe("clearTagCache", () => {
    test("keeps every favorite's tags readable", () => {
      const collection = new FavoritesCollection();
      const [favorite] = collection.append([createPost({ id: "1", tags: "apple" })]);
      const cached = favorite.tags;

      collection.clearTagCache();
      expect(favorite.tags).not.toBe(cached);
      expect(favorite.tags).toEqual(new Set(["apple"]));
    });
  });

  describe("compact", () => {
    test("keeps every favorite readable", () => {
      const collection = new FavoritesCollection();

      collection.append([createPost({ id: "1", tags: "apple" })]);
      collection.compact();
      expect(collection.findFavorite("1")?.tags).toEqual(new Set(["apple"]));
    });
  });
});
