import { Post } from "@/core/domain/post/post";
import { toRatingMask } from "@/core/domain/post/rating_mask";
import { createPost, createPosts } from "@/testing/post";
import { describe, expect, test } from "vitest";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { buildFavoritesSearchRequest } from "@/core/features/favorites/testing/favorites_search_request_builder";
import { StringInterner } from "@/core/utils/string/string_interner";

interface Setup {
  collection: FavoritesCollection;
  favorites: readonly Favorite[];
  index: FavoritesSearchIndex;
}

function setup(posts: Post[] = []): Setup {
  const collection = new FavoritesCollection(new StringInterner());
  const favorites = collection.append(posts);
  const index = new FavoritesSearchIndex(new StringInterner());

  index.rebuild(favorites);
  return { collection, favorites, index };
}

function getPostIds(favorites: readonly Favorite[]): string[] {
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
      expect(getPostIds(index.search(buildFavoritesSearchRequest({ query: "apple" })))).toEqual(["1", "2"]);
    });

    test("announces the added favorites once they are searchable", () => {
      const { collection, index } = setup();
      const added = collection.append(createTaggedPosts("apple"));
      const announced: string[][] = [];

      index.indexed.on(favorites => announced.push(getPostIds(index.match(buildFavoritesSearchRequest({ query: "apple" }), favorites))));
      index.add(added);
      expect(announced).toEqual([["1"]]);
    });
  });

  describe("update", () => {
    test("matches a favorite by its refreshed tags", () => {
      const { favorites: [favorite], collection, index } = setup(createTaggedPosts("apple"));

      collection.overwrite(createPost({ id: "1", tags: "banana" }));
      index.update([{ doc: favorite, oldTerms: new Set(["apple"]), newTerms: favorite.tags }]);
      expect(getPostIds(index.search(buildFavoritesSearchRequest({ query: "banana" })))).toEqual(["1"]);
    });
  });

  describe("countFavoritesWithTag", () => {
    test("counts the favorites carrying a tag", () => {
      const { index } = setup(createTaggedPosts("apple", "apple banana", "cherry"));

      expect(["apple", "banana", "ghost"].map(tag => index.countFavoritesWithTag(tag))).toEqual([2, 1, 0]);
    });
  });

  describe("rebuild", () => {
    test("searches only the given favorites", () => {
      const { favorites, index } = setup(createTaggedPosts("apple", "apple"));

      index.rebuild(favorites.slice(1));
      expect(getPostIds(index.search(buildFavoritesSearchRequest({ query: "apple" })))).toEqual(["2"]);
    });

    test("announces the rebuild once the favorites are searchable", () => {
      const { collection, index } = setup();
      const favorites = collection.append(createTaggedPosts("apple"));
      const announced: string[][] = [];

      index.rebuilt.on(() => announced.push(getPostIds(index.search(buildFavoritesSearchRequest({ query: "apple" })))));
      index.rebuild(favorites);
      expect(announced).toEqual([["1"]]);
    });

    test("announces no added favorites", () => {
      const { favorites, index } = setup(createTaggedPosts("apple"));
      const announced: Array<readonly Favorite[]> = [];

      index.indexed.on(added => announced.push(added));
      index.rebuild(favorites);
      expect(announced).toEqual([]);
    });
  });

  describe("populated", () => {
    test("stays unreached while no favorite has been indexed", () => {
      const index = new FavoritesSearchIndex(new StringInterner());

      index.add([]);
      index.rebuild([]);
      expect(index.populated.reached).toBe(false);
    });

    test("reaches once favorites are first added", () => {
      const index = new FavoritesSearchIndex(new StringInterner());
      const collection = new FavoritesCollection(new StringInterner());

      index.add(collection.append([createPost({ id: "1" })]));
      index.add(collection.append([createPost({ id: "2" })]));
      expect(index.populated.reached).toBe(true);
    });

    test("reaches once rebuilt from favorites", () => {
      const index = new FavoritesSearchIndex(new StringInterner());

      index.rebuild(new FavoritesCollection(new StringInterner()).append(createTaggedPosts("apple")));
      expect(index.populated.reached).toBe(true);
    });
  });

  describe("search", () => {
    test("returns every indexed favorite matching the query", () => {
      const { index } = setup(createTaggedPosts("apple", "banana", "apple"));

      expect(getPostIds(index.search(buildFavoritesSearchRequest({ query: "apple" })))).toEqual(["1", "3"]);
    });

    test("keeps only favorites whose rating is allowed", () => {
      const { index } = setup([createPost({ id: "1", rating: "safe" }), createPost({ id: "2", rating: "explicit" })]);

      expect(getPostIds(index.search(buildFavoritesSearchRequest({ allowedRatings: toRatingMask("safe") })))).toEqual(["1"]);
    });

    test("returns nothing without an expression", () => {
      const { index } = setup(createTaggedPosts("apple", "banana"));

      expect(index.search(buildFavoritesSearchRequest({ expression: undefined }))).toEqual([]);
    });

    test.each([
      { sortKey: "favorited", isSortAscending: false, expected: ["1", "3", "2"] },
      { sortKey: "favorited", isSortAscending: true, expected: ["2", "3", "1"] },
      { sortKey: "score", isSortAscending: false, expected: ["3", "2", "1"] },
      { sortKey: "score", isSortAscending: true, expected: ["1", "2", "3"] }
    ] as const)("orders by $sortKey, ascending $isSortAscending, as $expected", ({ sortKey, isSortAscending, expected }) => {
      const { index } = setup(["1", "3", "2"].map(id => createPost({ id, score: Number(id) })));

      expect(getPostIds(index.search(buildFavoritesSearchRequest({ sortKey, isSortAscending })))).toEqual(expected);
    });

    test("orders by the shuffle seed for a random sort", () => {
      const { index } = setup(createNumberedPosts(5));
      const random = index.search(buildFavoritesSearchRequest({ sortKey: "random", shuffleSeed: 7 }));

      expect(random).toEqual(index.search(buildFavoritesSearchRequest({ isShuffled: true, shuffleSeed: 7 })));
    });

    test("shuffles instead of sorting while shuffled", () => {
      const { index } = setup(createNumberedPosts(20));

      expect(index.search(buildFavoritesSearchRequest({ isShuffled: true }))).not.toEqual(index.search(buildFavoritesSearchRequest()));
    });

    test("returns the same order for the same seed regardless of the indexed order", () => {
      const request = buildFavoritesSearchRequest({ isShuffled: true, shuffleSeed: 3 });
      const forward = setup(createNumberedPosts(5)).index.search(request);
      const backward = setup(createNumberedPosts(5).toReversed()).index.search(request);

      expect(getPostIds(backward)).toEqual(getPostIds(forward));
    });

    test("returns a different order for a different seed", () => {
      const { index } = setup(createNumberedPosts(20));

      expect(index.search(buildFavoritesSearchRequest({ isShuffled: true, shuffleSeed: 1 })))
        .not.toEqual(index.search(buildFavoritesSearchRequest({ isShuffled: true, shuffleSeed: 2 })));
    });

    test("keeps the shuffled order of the favorites that still match a narrower search", () => {
      const { index } = setup(createTaggedPosts(...Array.from({ length: 20 }, (_, position) => (position % 2 === 0 ? "apple" : "apple banana"))));
      const everythingPostIds = getPostIds(index.search(buildFavoritesSearchRequest({ isShuffled: true })));
      const narrowedPostIds = getPostIds(index.search(buildFavoritesSearchRequest({ isShuffled: true, query: "banana" })));

      expect(narrowedPostIds).toEqual(everythingPostIds.filter(id => narrowedPostIds.includes(id)));
    });
  });

  describe("match", () => {
    test("returns the candidates matching the query", () => {
      const { favorites, index } = setup(createTaggedPosts("apple", "banana", "apple"));

      expect(getPostIds(index.match(buildFavoritesSearchRequest({ query: "apple" }), favorites))).toEqual(["1", "3"]);
    });

    test("returns every candidate for an empty query", () => {
      const { favorites, index } = setup(createTaggedPosts("apple", "banana"));

      expect(getPostIds(index.match(buildFavoritesSearchRequest(), favorites))).toEqual(["1", "2"]);
    });

    test("matches every indexed favorite without candidates", () => {
      const { index } = setup(createTaggedPosts("apple", "banana", "apple"));

      expect(getPostIds(index.match(buildFavoritesSearchRequest({ query: "apple" })))).toEqual(["1", "3"]);
    });

    test("matches a metric comparison term", () => {
      const { favorites, index } = setup([1, 2, 3].map(score => createPost({ id: String(score), score })));

      expect(getPostIds(index.match(buildFavoritesSearchRequest({ query: "score:>1" }), favorites))).toEqual(["2", "3"]);
    });

    test("keeps only candidates whose rating is allowed", () => {
      const { favorites, index } = setup([createPost({ id: "1", rating: "safe" }), createPost({ id: "2", rating: "explicit" })]);

      expect(getPostIds(index.match(buildFavoritesSearchRequest({ allowedRatings: toRatingMask("safe") }), favorites))).toEqual(["1"]);
    });

    test("keeps the indexed order regardless of the sort order", () => {
      const { favorites, index } = setup(["1", "3", "2"].map(id => createPost({ id, score: Number(id) })));

      expect(getPostIds(index.match(buildFavoritesSearchRequest({ sortKey: "score", isSortAscending: true }), favorites))).toEqual(["1", "3", "2"]);
    });

    test("negates within the candidates only", () => {
      const { favorites, index } = setup(createTaggedPosts("banana", "apple", "banana", "apple"));

      expect(getPostIds(index.match(buildFavoritesSearchRequest({ query: "-apple" }), favorites.slice(2)))).toEqual(["3"]);
    });

    test("returns nothing without an expression", () => {
      const { favorites, index } = setup(createTaggedPosts("apple", "banana"));

      expect(index.match(buildFavoritesSearchRequest({ expression: undefined }), favorites)).toEqual([]);
    });
  });
});
