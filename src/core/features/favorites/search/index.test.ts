import { Post, getRatingBit } from "@/core/domain/post/post";
import { createPost, createPosts } from "@/testing/post";
import { describe, expect, test } from "vitest";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesCollection } from "@/core/features/favorites/collection/collection";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/index";
import { createSearchRequest } from "@/core/features/favorites/testing/search";

interface Setup {
  collection: FavoritesCollection;
  favorites: Favorite[];
  index: FavoritesSearchIndex;
}

function setup(posts: Post[] = []): Setup {
  const collection = new FavoritesCollection();
  const favorites = collection.append(posts);
  const index = new FavoritesSearchIndex();

  index.rebuild(favorites);
  return { collection, favorites, index };
}

function getIds(favorites: readonly Favorite[]): string[] {
  return favorites.map(favorite => favorite.id);
}

function createTaggedPosts(...tags: string[]): Post[] {
  return tags.map((tag, index) => createPost({ id: String(index + 1), tags: tag }));
}

function createNumberedPosts(count: number): Post[] {
  return createPosts(...Array.from({ length: count }, (_, index) => String(index + 1)));
}

describe("FavoritesSearchIndex", () => {
  describe("add", () => {
    test("makes the added favorites searchable", () => {
      const { collection, index } = setup(createTaggedPosts("apple"));

      index.add(collection.append([createPost({ id: "2", tags: "apple" })]));
      expect(getIds(index.search(createSearchRequest({ query: "apple" })))).toEqual(["1", "2"]);
    });

    test("announces the added favorites once they are searchable", () => {
      const { collection, index } = setup();
      const added = collection.append(createTaggedPosts("apple"));
      const announced: string[][] = [];

      index.indexed.on(favorites => announced.push(getIds(index.match(createSearchRequest({ query: "apple" }), favorites))));
      index.add(added);
      expect(announced).toEqual([["1"]]);
    });
  });

  describe("update", () => {
    test("matches a favorite by its refreshed tags", () => {
      const { collection, index } = setup(createTaggedPosts("apple"));
      const refreshed = collection.overwrite(createPost({ id: "1", tags: "banana" }));

      index.update(refreshed === undefined ? [] : [refreshed]);
      expect(getIds(index.search(createSearchRequest({ query: "banana" })))).toEqual(["1"]);
    });
  });

  describe("rebuild", () => {
    test("searches only the given favorites", () => {
      const { favorites, index } = setup(createTaggedPosts("apple", "apple"));

      index.rebuild(favorites.slice(1));
      expect(getIds(index.search(createSearchRequest({ query: "apple" })))).toEqual(["2"]);
    });

    test("announces the rebuild once the favorites are searchable", () => {
      const { collection, index } = setup();
      const favorites = collection.append(createTaggedPosts("apple"));
      const announced: string[][] = [];

      index.rebuilt.on(() => announced.push(getIds(index.search(createSearchRequest({ query: "apple" })))));
      index.rebuild(favorites);
      expect(announced).toEqual([["1"]]);
    });

    test("announces no added favorites", () => {
      const { favorites, index } = setup(createTaggedPosts("apple"));
      const announced: Favorite[][] = [];

      index.indexed.on(added => announced.push(added));
      index.rebuild(favorites);
      expect(announced).toEqual([]);
    });
  });

  describe("search", () => {
    test("returns every indexed favorite matching the query", () => {
      const { index } = setup(createTaggedPosts("apple", "banana", "apple"));

      expect(getIds(index.search(createSearchRequest({ query: "apple" })))).toEqual(["1", "3"]);
    });

    test("keeps only favorites whose rating is allowed", () => {
      const { index } = setup([createPost({ id: "1", rating: "safe" }), createPost({ id: "2", rating: "explicit" })]);

      expect(getIds(index.search(createSearchRequest({ allowedRatings: getRatingBit("safe") })))).toEqual(["1"]);
    });

    test("returns nothing without an expression", () => {
      const { index } = setup(createTaggedPosts("apple", "banana"));

      expect(index.search(createSearchRequest({ expression: undefined }))).toEqual([]);
    });

    test.each([
      { sortKey: "favorited", isSortAscending: false, expected: ["1", "3", "2"] },
      { sortKey: "favorited", isSortAscending: true, expected: ["2", "3", "1"] },
      { sortKey: "score", isSortAscending: false, expected: ["3", "2", "1"] },
      { sortKey: "score", isSortAscending: true, expected: ["1", "2", "3"] }
    ] as const)("orders by $sortKey, ascending $isSortAscending, as $expected", ({ sortKey, isSortAscending, expected }) => {
      const { index } = setup(["1", "3", "2"].map(id => createPost({ id, score: Number(id) })));

      expect(getIds(index.search(createSearchRequest({ sortKey, isSortAscending })))).toEqual(expected);
    });

    test("orders by the shuffle seed for a random sort", () => {
      const { index } = setup(createNumberedPosts(5));
      const random = index.search(createSearchRequest({ sortKey: "random", shuffleSeed: 7 }));

      expect(random).toEqual(index.search(createSearchRequest({ isShuffled: true, shuffleSeed: 7 })));
    });

    test("shuffles instead of sorting while shuffled", () => {
      const { index } = setup(createNumberedPosts(20));

      expect(index.search(createSearchRequest({ isShuffled: true }))).not.toEqual(index.search(createSearchRequest()));
    });

    test("returns the same order for the same seed regardless of the indexed order", () => {
      const request = createSearchRequest({ isShuffled: true, shuffleSeed: 3 });
      const forward = setup(createNumberedPosts(5)).index.search(request);
      const backward = setup(createNumberedPosts(5).toReversed()).index.search(request);

      expect(getIds(backward)).toEqual(getIds(forward));
    });

    test("returns a different order for a different seed", () => {
      const { index } = setup(createNumberedPosts(20));

      expect(index.search(createSearchRequest({ isShuffled: true, shuffleSeed: 1 })))
        .not.toEqual(index.search(createSearchRequest({ isShuffled: true, shuffleSeed: 2 })));
    });

    test("keeps the shuffled order of the favorites that still match a narrower search", () => {
      const { index } = setup(createTaggedPosts(...Array.from({ length: 20 }, (_, position) => (position % 2 === 0 ? "apple" : "apple banana"))));
      const everythingIds = getIds(index.search(createSearchRequest({ isShuffled: true })));
      const narrowedIds = getIds(index.search(createSearchRequest({ isShuffled: true, query: "banana" })));

      expect(narrowedIds).toEqual(everythingIds.filter(id => narrowedIds.includes(id)));
    });
  });

  describe("match", () => {
    test("returns the candidates matching the query", () => {
      const { favorites, index } = setup(createTaggedPosts("apple", "banana", "apple"));

      expect(getIds(index.match(createSearchRequest({ query: "apple" }), favorites))).toEqual(["1", "3"]);
    });

    test("returns every candidate for an empty query", () => {
      const { favorites, index } = setup(createTaggedPosts("apple", "banana"));

      expect(getIds(index.match(createSearchRequest(), favorites))).toEqual(["1", "2"]);
    });

    test("matches every indexed favorite without candidates", () => {
      const { index } = setup(createTaggedPosts("apple", "banana", "apple"));

      expect(getIds(index.match(createSearchRequest({ query: "apple" })))).toEqual(["1", "3"]);
    });

    test("matches a metric comparison term", () => {
      const { favorites, index } = setup([1, 2, 3].map(score => createPost({ id: String(score), score })));

      expect(getIds(index.match(createSearchRequest({ query: "score:>1" }), favorites))).toEqual(["2", "3"]);
    });

    test("keeps only candidates whose rating is allowed", () => {
      const { favorites, index } = setup([createPost({ id: "1", rating: "safe" }), createPost({ id: "2", rating: "explicit" })]);

      expect(getIds(index.match(createSearchRequest({ allowedRatings: getRatingBit("safe") }), favorites))).toEqual(["1"]);
    });

    test("keeps the indexed order regardless of the sort order", () => {
      const { favorites, index } = setup(["1", "3", "2"].map(id => createPost({ id, score: Number(id) })));

      expect(getIds(index.match(createSearchRequest({ sortKey: "score", isSortAscending: true }), favorites))).toEqual(["1", "3", "2"]);
    });

    test("negates within the candidates only", () => {
      const { favorites, index } = setup(createTaggedPosts("banana", "apple", "banana", "apple"));

      expect(getIds(index.match(createSearchRequest({ query: "-apple" }), favorites.slice(2)))).toEqual(["3"]);
    });

    test("returns nothing without an expression", () => {
      const { favorites, index } = setup(createTaggedPosts("apple", "banana"));

      expect(index.match(createSearchRequest({ expression: undefined }), favorites)).toEqual([]);
    });
  });
});
