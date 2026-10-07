import { Post, getRatingBit } from "@/core/domain/post/post";
import { createPost, createPosts } from "@/testing/post";
import { describe, expect, test } from "vitest";
import { BitSearchEngine } from "@/core/search/engines/bit/bit_search_engine";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { FavoritesCollection } from "@/core/features/favorites/model/collection/collection";
import { FavoritesSearcher } from "@/core/features/favorites/model/search/searcher";
import { createSearchRequest } from "@/core/features/favorites/testing/request";

function setup(posts: Post[]): { favorites: Favorite[]; searcher: FavoritesSearcher } {
  const collection = new FavoritesCollection();
  const favorites = collection.append(posts);
  const engine = new BitSearchEngine<Favorite>(favorite => favorite.tags, (favorite, metric) => favorite.getMetric(metric));
  const searcher = new FavoritesSearcher({
    engine,
    getRatingBit: (favorite: Favorite): number => collection.getRatingBit(favorite)
  });

  engine.rebuild(favorites);
  return { favorites, searcher };
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

describe("FavoritesSearcher", () => {
  describe("search", () => {
    test("returns every indexed favorite matching the query", () => {
      const { searcher } = setup(createTaggedPosts("apple", "banana", "apple"));

      expect(getIds(searcher.search(createSearchRequest({ query: "apple" })))).toEqual(["1", "3"]);
    });

    test("keeps only favorites whose rating is allowed", () => {
      const { searcher } = setup([createPost({ id: "1", rating: "safe" }), createPost({ id: "2", rating: "explicit" })]);

      expect(getIds(searcher.search(createSearchRequest({ allowedRatings: getRatingBit("safe") })))).toEqual(["1"]);
    });

    test("returns nothing without an expression", () => {
      const { searcher } = setup(createTaggedPosts("apple", "banana"));

      expect(searcher.search(createSearchRequest({ expression: undefined }))).toEqual([]);
    });

    test.each([
      { sortKey: "favorited", isSortAscending: false, expected: ["1", "3", "2"] },
      { sortKey: "favorited", isSortAscending: true, expected: ["2", "3", "1"] },
      { sortKey: "score", isSortAscending: false, expected: ["3", "2", "1"] },
      { sortKey: "score", isSortAscending: true, expected: ["1", "2", "3"] }
    ] as const)("orders by $sortKey, ascending $isSortAscending, as $expected", ({ sortKey, isSortAscending, expected }) => {
      const { searcher } = setup(["1", "3", "2"].map(id => createPost({ id, score: Number(id) })));

      expect(getIds(searcher.search(createSearchRequest({ sortKey, isSortAscending })))).toEqual(expected);
    });

    test("orders by the shuffle seed for a random sort", () => {
      const { searcher } = setup(createNumberedPosts(5));
      const random = searcher.search(createSearchRequest({ sortKey: "random", shuffleSeed: 7 }));

      expect(random).toEqual(searcher.search(createSearchRequest({ isShuffled: true, shuffleSeed: 7 })));
    });

    test("shuffles instead of sorting while shuffled", () => {
      const { searcher } = setup(createNumberedPosts(20));

      expect(searcher.search(createSearchRequest({ isShuffled: true }))).not.toEqual(searcher.search(createSearchRequest()));
    });

    test("returns the same order for the same seed regardless of the indexed order", () => {
      const request = createSearchRequest({ isShuffled: true, shuffleSeed: 3 });
      const forward = setup(createNumberedPosts(5)).searcher.search(request);
      const backward = setup(createNumberedPosts(5).toReversed()).searcher.search(request);

      expect(getIds(backward)).toEqual(getIds(forward));
    });

    test("returns a different order for a different seed", () => {
      const { searcher } = setup(createNumberedPosts(20));

      expect(searcher.search(createSearchRequest({ isShuffled: true, shuffleSeed: 1 })))
        .not.toEqual(searcher.search(createSearchRequest({ isShuffled: true, shuffleSeed: 2 })));
    });

    test("keeps the shuffled order of the favorites that still match a narrower search", () => {
      const { searcher } = setup(createTaggedPosts(...Array.from({ length: 20 }, (_, index) => (index % 2 === 0 ? "apple" : "apple banana"))));
      const everythingIds = getIds(searcher.search(createSearchRequest({ isShuffled: true })));
      const narrowedIds = getIds(searcher.search(createSearchRequest({ isShuffled: true, query: "banana" })));

      expect(narrowedIds).toEqual(everythingIds.filter(id => narrowedIds.includes(id)));
    });
  });

  describe("match", () => {
    test("returns the candidates matching the query", () => {
      const { favorites, searcher } = setup(createTaggedPosts("apple", "banana", "apple"));

      expect(getIds(searcher.match(createSearchRequest({ query: "apple" }), favorites))).toEqual(["1", "3"]);
    });

    test("returns every candidate for an empty query", () => {
      const { favorites, searcher } = setup(createTaggedPosts("apple", "banana"));

      expect(getIds(searcher.match(createSearchRequest(), favorites))).toEqual(["1", "2"]);
    });

    test("matches every indexed favorite without candidates", () => {
      const { searcher } = setup(createTaggedPosts("apple", "banana", "apple"));

      expect(getIds(searcher.match(createSearchRequest({ query: "apple" })))).toEqual(["1", "3"]);
    });

    test("matches a metric comparison term", () => {
      const { favorites, searcher } = setup([1, 2, 3].map(score => createPost({ id: String(score), score })));

      expect(getIds(searcher.match(createSearchRequest({ query: "score:>1" }), favorites))).toEqual(["2", "3"]);
    });

    test("keeps only candidates whose rating is allowed", () => {
      const { favorites, searcher } = setup([createPost({ id: "1", rating: "safe" }), createPost({ id: "2", rating: "explicit" })]);

      expect(getIds(searcher.match(createSearchRequest({ allowedRatings: getRatingBit("safe") }), favorites))).toEqual(["1"]);
    });

    test("keeps the indexed order regardless of the sort order", () => {
      const { favorites, searcher } = setup(["1", "3", "2"].map(id => createPost({ id, score: Number(id) })));

      expect(getIds(searcher.match(createSearchRequest({ sortKey: "score", isSortAscending: true }), favorites))).toEqual(["1", "3", "2"]);
    });

    test("negates within the candidates only", () => {
      const { favorites, searcher } = setup(createTaggedPosts("banana", "apple", "banana", "apple"));

      expect(getIds(searcher.match(createSearchRequest({ query: "-apple" }), favorites.slice(2)))).toEqual(["3"]);
    });

    test("returns nothing without an expression", () => {
      const { favorites, searcher } = setup(createTaggedPosts("apple", "banana"));

      expect(searcher.match(createSearchRequest({ expression: undefined }), favorites)).toEqual([]);
    });
  });
});
