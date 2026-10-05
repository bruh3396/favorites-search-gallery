import { RatingBit, RatingMask, SortKey } from "@/types/search";
import { describe, expect, test, vi } from "vitest";
import { Favorite } from "@/types/favorite";
import { FavoritesSearcher } from "@/features/favorites/model/search/searcher";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { createPreferences } from "@/testing/preferences";

const RATINGS: Record<string, RatingMask> = { s: RatingBit.Safe, q: RatingBit.Questionable, e: RatingBit.Explicit };
const RATINGS_BY_FAVORITE = new WeakMap<Favorite, RatingMask>();

interface SearcherOverrides {
  onOwnFavoritesPage?: boolean;
  excludeBlacklist?: boolean;
  allowedRatings?: RatingMask;
  sortKey?: SortKey;
  sortAscending?: boolean;
  onSearchResultsChanged?: (results: Favorite[]) => void;
}

function createFavorite(id: string, rating: string, ...tags: string[]): Favorite {
  const favorite = { id, tags: new Set(tags), getMetric: () => Number(id) } as unknown as Favorite;

  RATINGS_BY_FAVORITE.set(favorite, RATINGS[rating]);
  return favorite;
}

function getIds(results: Favorite[]): string[] {
  return results.map(r => r.id);
}

describe("FavoritesSearcher", () => {
  // A searcher with the given favorites already indexed.
  function createSearcher(favorites: Favorite[], overrides: SearcherOverrides = {}): FavoritesSearcher {
    const preferences = createPreferences({
      favorites: {
        excludeBlacklist: overrides.excludeBlacklist ?? false,
        allowedRatings: overrides.allowedRatings ?? 7,
        sortKey: overrides.sortKey ?? "default",
        sortAscending: overrides.sortAscending ?? false
      }
    });
    const configuration = {
      userIsOnTheirOwnFavoritesPage: overrides.onOwnFavoritesPage ?? true,
      blacklistedTags: "blacklisted"
    };

    const onSearchResultsChanged = overrides.onSearchResultsChanged ?? vi.fn();
    const searcher = new FavoritesSearcher(configuration, {
      termsFor: favorite => favorite.tags,
      ratingFor: favorite => RATINGS_BY_FAVORITE.get(favorite) ?? RatingBit.Explicit,
      preferences,
      randomSource: new MemoryRandomSource(),
      onSearchResultsChanged
    });

    searcher.index(favorites);
    return searcher;
  }

  describe("search", () => {
    test("returns the favorites matching the query", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "banana"), createFavorite("3", "s", "apple")];
      const searcher = createSearcher(favorites);

      expect(getIds(searcher.search(favorites, "apple")).sort()).toEqual(["1", "3"]);
    });

    test("records the query as the current search query", () => {
      const favorites = [createFavorite("1", "s", "apple")];
      const searcher = createSearcher(favorites);

      searcher.search(favorites, "apple");
      expect(searcher.getCurrentSearchQuery()).toBe("apple");
    });

    test("stores the matches as the current search results", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "banana")];
      const searcher = createSearcher(favorites);

      searcher.search(favorites, "apple");
      expect(getIds(searcher.getCurrentSearchResults())).toEqual(["1"]);
    });

    test("notifies the onSearchResultsChanged listener", () => {
      const onChanged = vi.fn();
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "banana")];
      const searcher = createSearcher(favorites, { onSearchResultsChanged: onChanged });

      searcher.search(favorites, "apple");
      expect(getIds(onChanged.mock.lastCall?.[0])).toEqual(["1"]);
    });

    test("appends the blacklist tags when the blacklist is active", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "apple", "blacklisted")];
      const searcher = createSearcher(favorites, { excludeBlacklist: true });

      expect(getIds(searcher.search(favorites, "apple"))).toEqual(["1"]);
    });

    test("matches using a metric comparison term", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "apple"), createFavorite("3", "s", "apple")];
      const searcher = createSearcher(favorites);

      expect(getIds(searcher.search(favorites, "score:>1")).sort()).toEqual(["2", "3"]);
    });

    test("does not apply the blacklist when it is inactive", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "apple", "blacklisted")];
      const searcher = createSearcher(favorites);

      expect(getIds(searcher.search(favorites, "apple")).sort()).toEqual(["1", "2"]);
    });

    test("keeps only favorites whose rating is allowed", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "e", "apple")];
      const searcher = createSearcher(favorites, { allowedRatings: 1 });

      expect(getIds(searcher.search(favorites, "apple"))).toEqual(["1"]);
    });

    const orderingCases: { sortKey: SortKey; sortAscending: boolean; expected: string[] }[] = [
      { sortKey: "default", sortAscending: false, expected: ["1", "3", "2"] },
      { sortKey: "default", sortAscending: true, expected: ["2", "3", "1"] },
      { sortKey: "score", sortAscending: false, expected: ["3", "2", "1"] },
      { sortKey: "score", sortAscending: true, expected: ["1", "2", "3"] }
    ];

    test.each(orderingCases)("orders results by $sortKey, ascending=$sortAscending, as $expected", ({ sortKey, sortAscending, expected }) => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("3", "s", "apple"), createFavorite("2", "s", "apple")];
      const searcher = createSearcher(favorites, { sortKey, sortAscending });

      expect(getIds(searcher.search(favorites, "apple"))).toEqual(expected);
    });

    test("does not mutate the input array when reversing an ascending default sort", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "apple"), createFavorite("3", "s", "apple")];
      const searcher = createSearcher(favorites, { sortKey: "default", sortAscending: true });

      searcher.search(favorites, "");
      expect(getIds(favorites)).toEqual(["1", "2", "3"]);
    });

    test("returns a shuffled copy for a random sort without mutating the input array", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "apple"), createFavorite("3", "s", "apple")];
      const searcher = createSearcher(favorites, { sortKey: "random" });

      expect(getIds(searcher.search(favorites, "apple")).sort()).toEqual(["1", "2", "3"]);
      expect(getIds(favorites)).toEqual(["1", "2", "3"]);
    });
  });

  describe("searchPure", () => {
    test("returns matches without touching the current query or results", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "banana")];
      const searcher = createSearcher(favorites);

      expect(getIds(searcher.searchPure(favorites, "apple"))).toEqual(["1"]);
      expect(searcher.getCurrentSearchQuery()).toBe("");
      expect(searcher.getCurrentSearchResults()).toEqual([]);
    });

    test("returns all favorites for an empty query", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "banana")];
      const searcher = createSearcher(favorites);

      expect(getIds(searcher.searchPure(favorites, "")).sort()).toEqual(["1", "2"]);
    });

    test("appends the blacklist tags when the blacklist is active", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "apple", "blacklisted")];
      const searcher = createSearcher(favorites, { excludeBlacklist: true });

      expect(getIds(searcher.searchPure(favorites, "apple"))).toEqual(["1"]);
    });

    test("filters by rating", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "e", "apple")];
      const searcher = createSearcher(favorites, { allowedRatings: 1 });

      expect(getIds(searcher.searchPure(favorites, "apple"))).toEqual(["1"]);
    });
  });

  describe("reSearch", () => {
    test("re-runs the current query without changing it", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "banana")];
      const searcher = createSearcher(favorites);

      searcher.search(favorites, "apple");
      expect(getIds(searcher.reSearch(favorites))).toEqual(["1"]);
      expect(searcher.getCurrentSearchQuery()).toBe("apple");
    });
  });

  describe("add", () => {
    test("makes newly indexed favorites matchable", () => {
      const favorites = [createFavorite("1", "s", "apple")];
      const added = createFavorite("2", "s", "apple");
      const searcher = createSearcher(favorites);

      searcher.add([added]);
      expect(getIds(searcher.search([...favorites, added], "apple")).sort()).toEqual(["1", "2"]);
    });
  });

  describe("update", () => {
    test("reflects corrected tags for a favorite", () => {
      const target = createFavorite("1", "s", "ct");
      const favorites = [target];
      const oldTerms = new Set(target.tags);
      const searcher = createSearcher(favorites);

      target.tags.clear();
      target.tags.add("apple");
      searcher.update([{ doc: target, oldTerms, newTerms: target.tags }]);
      expect(getIds(searcher.search(favorites, "ct"))).toEqual([]);
      expect(getIds(searcher.search(favorites, "apple"))).toEqual(["1"]);
    });
  });

  describe("invertResults", () => {
    test("returns favorites absent from the current results", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "banana"), createFavorite("3", "s", "fox")];
      const searcher = createSearcher(favorites);

      searcher.search(favorites, "apple");
      expect(getIds(searcher.invertResults()).sort()).toEqual(["2", "3"]);
    });

    test("replaces the current results with the inverted set", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "banana")];
      const searcher = createSearcher(favorites);

      searcher.search(favorites, "apple");
      searcher.invertResults();
      expect(getIds(searcher.getCurrentSearchResults())).toEqual(["2"]);
    });

    test("enforces the blacklist when off the user's own favorites page", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "banana", "blacklisted")];
      const searcher = createSearcher(favorites, { onOwnFavoritesPage: false });

      searcher.search(favorites, "apple");
      expect(getIds(searcher.invertResults())).toEqual([]);
    });
  });

  describe("appendResults", () => {
    test("appends matched favorites to the current results", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "apple")];
      const searcher = createSearcher(favorites);

      searcher.search([favorites[0]], "apple");
      searcher.appendResults([favorites[1]]);
      expect(getIds(searcher.getCurrentSearchResults())).toEqual(["1", "2"]);
    });
  });

  describe("prependResults", () => {
    test("prepends matched favorites to the current results", () => {
      const favorites = [createFavorite("2", "s", "apple"), createFavorite("1", "s", "apple")];
      const searcher = createSearcher(favorites);

      searcher.search([favorites[0]], "apple");
      searcher.prependResults([favorites[1]]);
      expect(getIds(searcher.getCurrentSearchResults())).toEqual(["1", "2"]);
    });
  });

  describe("shuffleSearchResults", () => {
    test("keeps the same set of results", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "apple"), createFavorite("3", "s", "apple")];
      const searcher = createSearcher(favorites);

      searcher.search(favorites, "apple");
      expect(getIds(searcher.shuffleSearchResults()).sort()).toEqual(["1", "2", "3"]);
    });
  });
});
