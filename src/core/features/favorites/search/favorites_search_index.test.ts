import { createPost, createPosts } from "@/testing/post";
import { describe, expect, test } from "vitest";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { Post } from "@/core/domain/post/post";
import { StringInterner } from "@/core/utils/string/string_interner";
import { buildFavoritesSearchRequest } from "@/core/features/favorites/testing/favorites_search_request_builder";
import { toRatingMask } from "@/core/domain/post/rating_mask";

interface Setup {
  favoritesCollection: FavoritesCollection;
  favorites: readonly Favorite[];
  favoritesSearchIndex: FavoritesSearchIndex;
}

function setup(posts: Post[] = []): Setup {
  const favoritesCollection = new FavoritesCollection(new StringInterner());
  const arenaFavorites = favoritesCollection.append(posts);
  const favoritesSearchIndex = new FavoritesSearchIndex(new StringInterner());

  favoritesSearchIndex.rebuild(arenaFavorites);
  return { favoritesCollection, favorites: arenaFavorites, favoritesSearchIndex };
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
      const { favoritesCollection, favoritesSearchIndex } = setup(createTaggedPosts("apple"));

      favoritesSearchIndex.add(favoritesCollection.append([createPost({ id: "2", tags: "apple" })]));
      expect(getPostIds(favoritesSearchIndex.search(buildFavoritesSearchRequest({ query: "apple" })))).toEqual(["1", "2"]);
    });

    test("announces the added favorites once they are searchable", () => {
      const { favoritesCollection, favoritesSearchIndex } = setup();
      const addedArenaFavorites = favoritesCollection.append(createTaggedPosts("apple"));
      const announced: string[][] = [];

      favoritesSearchIndex.indexed.on(favorites => {
        announced.push(getPostIds(favoritesSearchIndex.match(buildFavoritesSearchRequest({ query: "apple" }), favorites)));
      });
      favoritesSearchIndex.add(addedArenaFavorites);
      expect(announced).toEqual([["1"]]);
    });
  });

  describe("update", () => {
    test("matches a favorite by its refreshed tags", () => {
      const { favorites: [favorite], favoritesCollection, favoritesSearchIndex } = setup(createTaggedPosts("apple"));

      favoritesCollection.overwrite(createPost({ id: "1", tags: "banana" }));
      favoritesSearchIndex.update([{ doc: favorite, oldTerms: new Set(["apple"]), newTerms: favorite.tags }]);
      expect(getPostIds(favoritesSearchIndex.search(buildFavoritesSearchRequest({ query: "banana" })))).toEqual(["1"]);
    });
  });

  describe("countFavoritesWithTag", () => {
    test("counts the favorites carrying a tag", () => {
      const { favoritesSearchIndex } = setup(createTaggedPosts("apple", "apple banana", "cherry"));

      expect(["apple", "banana", "ghost"].map(tag => favoritesSearchIndex.countFavoritesWithTag(tag))).toEqual([2, 1, 0]);
    });
  });

  describe("getTagsStartingWith", () => {
    test("finds the tags with a prefix, alphabetically", () => {
      const { favoritesSearchIndex } = setup(createTaggedPosts("apricot", "apple banana"));

      expect(favoritesSearchIndex.getTagsStartingWith("ap")).toEqual(["apple", "apricot"]);
    });
  });

  describe("rebuild", () => {
    test("searches only the given favorites", () => {
      const { favorites, favoritesSearchIndex } = setup(createTaggedPosts("apple", "apple"));

      favoritesSearchIndex.rebuild(favorites.slice(1));
      expect(getPostIds(favoritesSearchIndex.search(buildFavoritesSearchRequest({ query: "apple" })))).toEqual(["2"]);
    });

    test("announces the rebuild once the favorites are searchable", () => {
      const { favoritesCollection, favoritesSearchIndex } = setup();
      const arenaFavorites = favoritesCollection.append(createTaggedPosts("apple"));
      const announced: string[][] = [];

      favoritesSearchIndex.rebuilt.on(() => announced.push(getPostIds(favoritesSearchIndex.search(buildFavoritesSearchRequest({ query: "apple" })))));
      favoritesSearchIndex.rebuild(arenaFavorites);
      expect(announced).toEqual([["1"]]);
    });

    test("announces no added favorites", () => {
      const { favorites, favoritesSearchIndex } = setup(createTaggedPosts("apple"));
      const announcedFavorites: Array<readonly Favorite[]> = [];

      favoritesSearchIndex.indexed.on(addedFavorites => announcedFavorites.push(addedFavorites));
      favoritesSearchIndex.rebuild(favorites);
      expect(announcedFavorites).toEqual([]);
    });
  });

  describe("populated", () => {
    test("stays unreached while no favorite has been indexed", () => {
      const favoritesSearchIndex = new FavoritesSearchIndex(new StringInterner());

      favoritesSearchIndex.add([]);
      favoritesSearchIndex.rebuild([]);
      expect(favoritesSearchIndex.populated.reached).toBe(false);
    });

    test("reaches once favorites are first added", () => {
      const favoritesSearchIndex = new FavoritesSearchIndex(new StringInterner());
      const favoritesCollection = new FavoritesCollection(new StringInterner());

      favoritesSearchIndex.add(favoritesCollection.append([createPost({ id: "1" })]));
      favoritesSearchIndex.add(favoritesCollection.append([createPost({ id: "2" })]));
      expect(favoritesSearchIndex.populated.reached).toBe(true);
    });

    test("reaches once rebuilt from favorites", () => {
      const favoritesSearchIndex = new FavoritesSearchIndex(new StringInterner());

      favoritesSearchIndex.rebuild(new FavoritesCollection(new StringInterner()).append(createTaggedPosts("apple")));
      expect(favoritesSearchIndex.populated.reached).toBe(true);
    });
  });

  describe("search", () => {
    test("returns every indexed favorite matching the query", () => {
      const { favoritesSearchIndex } = setup(createTaggedPosts("apple", "banana", "apple"));

      expect(getPostIds(favoritesSearchIndex.search(buildFavoritesSearchRequest({ query: "apple" })))).toEqual(["1", "3"]);
    });

    test("keeps only favorites whose rating is allowed", () => {
      const { favoritesSearchIndex } = setup([createPost({ id: "1", rating: "safe" }), createPost({ id: "2", rating: "explicit" })]);

      expect(getPostIds(favoritesSearchIndex.search(buildFavoritesSearchRequest({ allowedRatings: toRatingMask("safe") })))).toEqual(["1"]);
    });

    test("returns nothing without an expression", () => {
      const { favoritesSearchIndex } = setup(createTaggedPosts("apple", "banana"));

      expect(favoritesSearchIndex.search(buildFavoritesSearchRequest({ searchExpression: undefined }))).toEqual([]);
    });

    test.each([
      { sortKey: "favorited", isSortAscending: false, expected: ["1", "3", "2"] },
      { sortKey: "favorited", isSortAscending: true, expected: ["2", "3", "1"] },
      { sortKey: "score", isSortAscending: false, expected: ["3", "2", "1"] },
      { sortKey: "score", isSortAscending: true, expected: ["1", "2", "3"] }
    ] as const)("orders by $sortKey, ascending $isSortAscending, as $expected", ({ sortKey, isSortAscending, expected }) => {
      const { favoritesSearchIndex } = setup(["1", "3", "2"].map(id => createPost({ id, score: Number(id) })));

      expect(getPostIds(favoritesSearchIndex.search(buildFavoritesSearchRequest({ sortKey, isSortAscending })))).toEqual(expected);
    });

    test("orders by the shuffle seed for a random sort", () => {
      const { favoritesSearchIndex } = setup(createNumberedPosts(5));
      const randomFavorites = favoritesSearchIndex.search(buildFavoritesSearchRequest({ sortKey: "random", shuffleSeed: 7 }));

      expect(randomFavorites).toEqual(favoritesSearchIndex.search(buildFavoritesSearchRequest({ isShuffled: true, shuffleSeed: 7 })));
    });

    test("shuffles instead of sorting while shuffled", () => {
      const { favoritesSearchIndex } = setup(createNumberedPosts(20));

      expect(favoritesSearchIndex.search(buildFavoritesSearchRequest({ isShuffled: true })))
        .not.toEqual(favoritesSearchIndex.search(buildFavoritesSearchRequest()));
    });

    test("returns the same order for the same seed regardless of the indexed order", () => {
      const favoritesSearchRequest = buildFavoritesSearchRequest({ isShuffled: true, shuffleSeed: 3 });
      const forwardFavorites = setup(createNumberedPosts(5)).favoritesSearchIndex.search(favoritesSearchRequest);
      const backwardFavorites = setup(createNumberedPosts(5).toReversed()).favoritesSearchIndex.search(favoritesSearchRequest);

      expect(getPostIds(backwardFavorites)).toEqual(getPostIds(forwardFavorites));
    });

    test("returns a different order for a different seed", () => {
      const { favoritesSearchIndex } = setup(createNumberedPosts(20));

      expect(favoritesSearchIndex.search(buildFavoritesSearchRequest({ isShuffled: true, shuffleSeed: 1 })))
        .not.toEqual(favoritesSearchIndex.search(buildFavoritesSearchRequest({ isShuffled: true, shuffleSeed: 2 })));
    });

    test("keeps the shuffled order of the favorites that still match a narrower search", () => {
      const { favoritesSearchIndex } = setup(createTaggedPosts(...Array.from({ length: 20 }, (_, position) => {
        return position % 2 === 0 ? "apple" : "apple banana";
      })));
      const everythingPostIds = getPostIds(favoritesSearchIndex.search(buildFavoritesSearchRequest({ isShuffled: true })));
      const narrowedPostIds = getPostIds(favoritesSearchIndex.search(buildFavoritesSearchRequest({ isShuffled: true, query: "banana" })));

      expect(narrowedPostIds).toEqual(everythingPostIds.filter(id => narrowedPostIds.includes(id)));
    });
  });

  describe("match", () => {
    test("returns the candidates matching the query", () => {
      const { favorites, favoritesSearchIndex } = setup(createTaggedPosts("apple", "banana", "apple"));

      expect(getPostIds(favoritesSearchIndex.match(buildFavoritesSearchRequest({ query: "apple" }), favorites))).toEqual(["1", "3"]);
    });

    test("returns every candidate for an empty query", () => {
      const { favorites, favoritesSearchIndex } = setup(createTaggedPosts("apple", "banana"));

      expect(getPostIds(favoritesSearchIndex.match(buildFavoritesSearchRequest(), favorites))).toEqual(["1", "2"]);
    });

    test("matches every indexed favorite without candidates", () => {
      const { favoritesSearchIndex } = setup(createTaggedPosts("apple", "banana", "apple"));

      expect(getPostIds(favoritesSearchIndex.match(buildFavoritesSearchRequest({ query: "apple" })))).toEqual(["1", "3"]);
    });

    test("matches a metric comparison term", () => {
      const { favorites, favoritesSearchIndex } = setup([1, 2, 3].map(score => createPost({ id: String(score), score })));

      expect(getPostIds(favoritesSearchIndex.match(buildFavoritesSearchRequest({ query: "score:>1" }), favorites))).toEqual(["2", "3"]);
    });

    test("keeps only candidates whose rating is allowed", () => {
      const { favorites, favoritesSearchIndex } = setup([createPost({ id: "1", rating: "safe" }), createPost({ id: "2", rating: "explicit" })]);

      expect(getPostIds(favoritesSearchIndex.match(buildFavoritesSearchRequest({ allowedRatings: toRatingMask("safe") }), favorites))).toEqual(["1"]);
    });

    test("keeps the indexed order regardless of the sort order", () => {
      const { favorites, favoritesSearchIndex } = setup(["1", "3", "2"].map(id => createPost({ id, score: Number(id) })));

      expect(getPostIds(favoritesSearchIndex.match(buildFavoritesSearchRequest({ sortKey: "score", isSortAscending: true }), favorites)))
        .toEqual(["1", "3", "2"]);
    });

    test("negates within the candidates only", () => {
      const { favorites, favoritesSearchIndex } = setup(createTaggedPosts("banana", "apple", "banana", "apple"));

      expect(getPostIds(favoritesSearchIndex.match(buildFavoritesSearchRequest({ query: "-apple" }), favorites.slice(2)))).toEqual(["3"]);
    });

    test("returns nothing without an expression", () => {
      const { favorites, favoritesSearchIndex } = setup(createTaggedPosts("apple", "banana"));

      expect(favoritesSearchIndex.match(buildFavoritesSearchRequest({ searchExpression: undefined }), favorites)).toEqual([]);
    });
  });
});
