import { Post, Rating } from "@/core/domain/post/post";
import { createPost, createPosts } from "@/testing/post";
import { describe, expect, test } from "vitest";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { FavoritesCollection } from "@/core/features/favorites/model/collection/collection";
import { FavoritesSearcher } from "@/core/features/favorites/model/search/searcher";
import { createSearchCriteria } from "@/core/features/favorites/testing/criteria";

function setup(posts: Post[]): { collection: FavoritesCollection; favorites: Favorite[]; searcher: FavoritesSearcher } {
  const collection = new FavoritesCollection();
  const favorites = collection.append(posts);
  const searcher = new FavoritesSearcher({ getRating: (favorite: Favorite): Rating => collection.getRating(favorite.id) });

  searcher.indexAll(favorites);
  return { collection, favorites, searcher };
}

function getIds(favorites: readonly Favorite[]): string[] {
  return favorites.map(favorite => favorite.id);
}

function createTaggedPosts(...tags: string[]): Post[] {
  return tags.map((tag, index) => createPost({ id: String(index + 1), tags: tag }));
}

describe("FavoritesSearcher", () => {
  describe("match", () => {
    test("returns the favorites matching the query", () => {
      const { favorites, searcher } = setup(createTaggedPosts("apple", "banana", "apple"));

      expect(getIds(searcher.match(favorites, createSearchCriteria({ query: "apple" })))).toEqual(["1", "3"]);
    });

    test("returns every favorite for an empty query", () => {
      const { favorites, searcher } = setup(createTaggedPosts("apple", "banana"));

      expect(getIds(searcher.match(favorites, createSearchCriteria()))).toEqual(["1", "2"]);
    });

    test("matches a metric comparison term", () => {
      const { favorites, searcher } = setup([1, 2, 3].map(score => createPost({ id: String(score), score })));

      expect(getIds(searcher.match(favorites, createSearchCriteria({ query: "score:>1" })))).toEqual(["2", "3"]);
    });

    test("drops favorites with any blacklisted tag", () => {
      const { favorites, searcher } = setup(createTaggedPosts("apple", "apple banana", "apple cherry"));

      expect(getIds(searcher.match(favorites, createSearchCriteria({ query: "apple", blacklistQuery: "-banana -cherry" })))).toEqual(["1"]);
    });

    test("drops favorites with a blacklisted tag for an empty query", () => {
      const { favorites, searcher } = setup(createTaggedPosts("apple", "banana"));

      expect(getIds(searcher.match(favorites, createSearchCriteria({ blacklistQuery: "-banana" })))).toEqual(["1"]);
    });

    test("keeps only favorites whose rating is allowed", () => {
      const { favorites, searcher } = setup([createPost({ id: "1", rating: "safe" }), createPost({ id: "2", rating: "explicit" })]);

      expect(getIds(searcher.match(favorites, createSearchCriteria({ allowedRatings: new Set(["safe"] as const) })))).toEqual(["1"]);
    });

    test("keeps the given order regardless of the sort order", () => {
      const { favorites, searcher } = setup(["1", "3", "2"].map(id => createPost({ id, score: Number(id) })));

      expect(getIds(searcher.match(favorites, createSearchCriteria({ sort: { key: "score", isAscending: true } })))).toEqual(["1", "3", "2"]);
    });
  });

  describe("search", () => {
    test.each([
      { key: "favorited", isAscending: false, expected: ["1", "3", "2"] },
      { key: "favorited", isAscending: true, expected: ["2", "3", "1"] },
      { key: "score", isAscending: false, expected: ["3", "2", "1"] },
      { key: "score", isAscending: true, expected: ["1", "2", "3"] }
    ] as const)("orders by $key, ascending $isAscending, as $expected", ({ key, isAscending, expected }) => {
      const { favorites, searcher } = setup(["1", "3", "2"].map(id => createPost({ id, score: Number(id) })));

      expect(getIds(searcher.search(favorites, createSearchCriteria({ sort: { key, isAscending } })))).toEqual(expected);
    });

    test("orders the matches by the shuffle seed for a random sort", () => {
      const { favorites, searcher } = setup(createPosts("1", "2", "3", "4", "5"));
      const results = searcher.search(favorites, createSearchCriteria({ sort: { key: "random", isAscending: false }, shuffleSeed: 7 }));

      expect(results).toEqual(searcher.shuffle(favorites, 7));
    });

    test("keeps the random order of the favorites that still match a narrower search", () => {
      const { favorites, searcher } = setup(createTaggedPosts(...Array.from({ length: 20 }, (_, index) => (index % 2 === 0 ? "apple" : "apple banana"))));
      const sort = { key: "random", isAscending: false } as const;
      const everything = getIds(searcher.search(favorites, createSearchCriteria({ sort })));
      const narrowed = getIds(searcher.search(favorites, createSearchCriteria({ sort, query: "banana" })));

      expect(narrowed).toEqual(everything.filter(id => narrowed.includes(id)));
    });

    test.each(["favorited", "score", "random"] as const)("returns a new array and leaves the given favorites in order for a %s sort", key => {
      const { favorites, searcher } = setup(createPosts("1", "2", "3"));
      const results = searcher.search(favorites, createSearchCriteria({ sort: { key, isAscending: true } }));

      expect(results).not.toBe(favorites);
      expect(getIds(favorites)).toEqual(["1", "2", "3"]);
    });
  });

  describe("invert", () => {
    test("returns the favorites missing from the results", () => {
      const { favorites, searcher } = setup(createTaggedPosts("apple", "banana", "cherry"));
      const criteria = createSearchCriteria({ query: "apple" });

      expect(getIds(searcher.invert(searcher.search(favorites, criteria), criteria))).toEqual(["2", "3"]);
    });

    test("drops favorites with a blacklisted tag", () => {
      const { favorites, searcher } = setup(createTaggedPosts("apple", "banana", "banana cherry"));
      const criteria = createSearchCriteria({ query: "apple", blacklistQuery: "-cherry" });

      expect(getIds(searcher.invert(searcher.search(favorites, criteria), criteria))).toEqual(["2"]);
    });
  });

  describe("shuffle", () => {
    test("returns the same favorites in a new array", () => {
      const { favorites, searcher } = setup(createPosts("1", "2", "3"));
      const shuffled = searcher.shuffle(favorites, 1);

      expect(shuffled).not.toBe(favorites);
      expect(getIds(shuffled).sort()).toEqual(["1", "2", "3"]);
    });

    test("returns the same order for the same seed", () => {
      const { favorites, searcher } = setup(createPosts("1", "2", "3", "4", "5"));

      expect(searcher.shuffle(favorites.toReversed(), 3)).toEqual(searcher.shuffle(favorites, 3));
    });

    test("returns a different order for a different seed", () => {
      const { favorites, searcher } = setup(createPosts(...Array.from({ length: 20 }, (_, index) => String(index + 1))));

      expect(searcher.shuffle(favorites, 1)).not.toEqual(searcher.shuffle(favorites, 2));
    });
  });

  describe("add", () => {
    test("makes the added favorites matchable", () => {
      const { collection, favorites, searcher } = setup(createTaggedPosts("apple"));
      const added = collection.append([createPost({ id: "2", tags: "apple" })]);

      searcher.addToIndex(added);
      expect(getIds(searcher.match([...favorites, ...added], createSearchCriteria({ query: "apple" })))).toEqual(["1", "2"]);
    });
  });

  describe("update", () => {
    test("matches a favorite by its refreshed tags", () => {
      const { collection, favorites, searcher } = setup(createTaggedPosts("apple"));
      const termUpdate = collection.overwrite(createPost({ id: "1", tags: "banana" }));

      searcher.updateIndex(termUpdate === undefined ? [] : [termUpdate]);
      expect(getIds(searcher.match(favorites, createSearchCriteria({ query: "banana" })))).toEqual(["1"]);
    });
  });
});
