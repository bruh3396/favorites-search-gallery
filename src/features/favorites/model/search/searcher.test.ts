import { DiscreteRating, Rating, SortKey } from "@/types/search";
import { afterEach, describe, expect, test, vi } from "vitest";
import { Environment } from "@/app/context/environment";
import { Favorite } from "@/types/favorite";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesSearcher } from "@/features/favorites/model/search/searcher";
import { Preferences } from "@/app/context/preferences";

const RATINGS: Record<string, Rating> = { s: DiscreteRating.Safe, q: DiscreteRating.Questionable, e: DiscreteRating.Explicit };

interface ContextOverrides {
  onOwnFavoritesPage?: boolean;
  excludeBlacklist?: boolean;
  allowedRatings?: Rating;
  sortKey?: SortKey;
  sortAscending?: boolean;
}

function createPreferences(overrides: ContextOverrides): Preferences {
  return {
    favorites: {
      excludeBlacklist: { value: overrides.excludeBlacklist ?? false },
      allowedRatings: { value: overrides.allowedRatings ?? 7 },
      sortKey: { value: overrides.sortKey ?? "default" },
      sortAscending: { value: overrides.sortAscending ?? false }
    }
  } as unknown as Preferences;
}

function createEnvironment(overrides: ContextOverrides): Environment {
  return {
    userIsOnTheirOwnFavoritesPage: overrides.onOwnFavoritesPage ?? true,
    negatedBlacklistedTags: "-blacklisted"
  } as unknown as Environment;
}

function createFavorite(id: string, rating: string, ...tags: string[]): Favorite {
  const tagSet = new Set(tags);
  return { id, tags: tagSet, consumeTags: () => tagSet, rating: RATINGS[rating], getMetric: () => Number(id) } as unknown as Favorite;
}

function idsOf(results: Favorite[]): string[] {
  return results.map(r => r.id);
}

const DEFAULT_USE_BIT_SEARCH_ENGINE = FavoritesConfig.useBitSearchEngine;

describe.each([
  { engine: "bit", useBitSearchEngine: true },
  { engine: "set", useBitSearchEngine: false }
])("FavoritesSearcher ($engine engine)", ({ useBitSearchEngine }) => {
  let searcher: FavoritesSearcher;

  afterEach(() => {
    FavoritesConfig.useBitSearchEngine = DEFAULT_USE_BIT_SEARCH_ENGINE;
  });

  function configureSearcher(favorites: Favorite[], overrides: ContextOverrides = {}, onChanged: (results: Favorite[]) => void = vi.fn()): void {
    FavoritesConfig.useBitSearchEngine = useBitSearchEngine;
    searcher = new FavoritesSearcher(createPreferences(overrides), createEnvironment(overrides), onChanged);
    searcher.index(favorites);
  }

  describe("search", () => {
    test("returns the favorites matching the query", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "banana"), createFavorite("3", "s", "apple")];

      configureSearcher(favorites);
      expect(idsOf(searcher.search(favorites, "apple")).sort()).toEqual(["1", "3"]);
    });

    test("records the query as the current search query", () => {
      const favorites = [createFavorite("1", "s", "apple")];

      configureSearcher(favorites);
      searcher.search(favorites, "apple");
      expect(searcher.getCurrentSearchQuery()).toBe("apple");
    });

    test("stores the matches as the current search results", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "banana")];

      configureSearcher(favorites);
      searcher.search(favorites, "apple");
      expect(idsOf(searcher.getCurrentSearchResults())).toEqual(["1"]);
    });

    test("notifies the onSearchResultsChanged listener", () => {
      const onChanged = vi.fn();
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "banana")];

      configureSearcher(favorites, {}, onChanged);
      searcher.search(favorites, "apple");
      expect(idsOf(onChanged.mock.lastCall?.[0])).toEqual(["1"]);
    });

    test("appends the blacklist tags when the blacklist is active", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "apple", "blacklisted")];

      configureSearcher(favorites, { excludeBlacklist: true });
      expect(idsOf(searcher.search(favorites, "apple"))).toEqual(["1"]);
    });

    test("matches using a metric comparison term", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "apple"), createFavorite("3", "s", "apple")];

      configureSearcher(favorites);
      expect(idsOf(searcher.search(favorites, "score:>1")).sort()).toEqual(["2", "3"]);
    });

    test("does not apply the blacklist when it is inactive", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "apple", "blacklisted")];

      configureSearcher(favorites);
      expect(idsOf(searcher.search(favorites, "apple")).sort()).toEqual(["1", "2"]);
    });
  });

  describe("searchPure", () => {
    test("returns matches without touching the current query or results", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "banana")];

      configureSearcher(favorites);
      expect(idsOf(searcher.searchPure(favorites, "apple"))).toEqual(["1"]);
      expect(searcher.getCurrentSearchQuery()).toBe("");
      expect(searcher.getCurrentSearchResults()).toEqual([]);
    });

    test("returns all favorites for an empty query", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "banana")];

      configureSearcher(favorites);
      expect(idsOf(searcher.searchPure(favorites, "")).sort()).toEqual(["1", "2"]);
    });

    test("appends the blacklist tags when the blacklist is active", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "apple", "blacklisted")];

      configureSearcher(favorites, { excludeBlacklist: true });
      expect(idsOf(searcher.searchPure(favorites, "apple"))).toEqual(["1"]);
    });

    test("filters by rating", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "e", "apple")];

      configureSearcher(favorites, { allowedRatings: 1 });
      expect(idsOf(searcher.searchPure(favorites, "apple"))).toEqual(["1"]);
    });
  });

  describe("filtering by rating", () => {
    test("keeps only favorites whose rating is allowed", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "e", "apple")];

      configureSearcher(favorites, { allowedRatings: 1 });
      expect(idsOf(searcher.search(favorites, "apple"))).toEqual(["1"]);
    });
  });

  describe("sorting", () => {
    const orderingCases: { sortKey: SortKey; sortAscending: boolean; expected: string[] }[] = [
      { sortKey: "default", sortAscending: false, expected: ["1", "3", "2"] },
      { sortKey: "default", sortAscending: true, expected: ["2", "3", "1"] },
      { sortKey: "score", sortAscending: false, expected: ["3", "2", "1"] },
      { sortKey: "score", sortAscending: true, expected: ["1", "2", "3"] }
    ];

    test.each(orderingCases)("sortKey=$sortKey ascending=$sortAscending orders results as $expected", ({ sortKey, sortAscending, expected }) => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("3", "s", "apple"), createFavorite("2", "s", "apple")];

      configureSearcher(favorites, { sortKey, sortAscending });
      expect(idsOf(searcher.search(favorites, "apple"))).toEqual(expected);
    });

    test("does not mutate the input array when reversing an ascending default sort", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "apple"), createFavorite("3", "s", "apple")];

      configureSearcher(favorites, { sortKey: "default", sortAscending: true });
      searcher.search(favorites, "");
      expect(idsOf(favorites)).toEqual(["1", "2", "3"]);
    });

    test("random sortKey returns a shuffled copy without mutating the input array", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "apple"), createFavorite("3", "s", "apple")];

      configureSearcher(favorites, { sortKey: "random" });
      expect(idsOf(searcher.search(favorites, "apple")).sort()).toEqual(["1", "2", "3"]);
      expect(idsOf(favorites)).toEqual(["1", "2", "3"]);
    });
  });

  describe("reSearch", () => {
    test("re-runs the current query without changing it", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "banana")];

      configureSearcher(favorites);
      searcher.search(favorites, "apple");
      expect(idsOf(searcher.reSearch(favorites))).toEqual(["1"]);
      expect(searcher.getCurrentSearchQuery()).toBe("apple");
    });
  });

  describe("add", () => {
    test("makes newly indexed favorites matchable", () => {
      const favorites = [createFavorite("1", "s", "apple")];
      const added = createFavorite("2", "s", "apple");

      configureSearcher(favorites);
      searcher.add([added]);
      expect(idsOf(searcher.search([...favorites, added], "apple")).sort()).toEqual(["1", "2"]);
    });
  });

  describe("update", () => {
    test("reflects corrected tags for a favorite", () => {
      const target = createFavorite("1", "s", "ct");
      const favorites = [target];
      const oldTerms = new Set(target.tags);

      configureSearcher(favorites);
      target.tags.clear();
      target.tags.add("apple");
      searcher.update([{ doc: target, oldTerms, newTerms: target.tags }]);
      expect(idsOf(searcher.search(favorites, "ct"))).toEqual([]);
      expect(idsOf(searcher.search(favorites, "apple"))).toEqual(["1"]);
    });
  });

  describe("invertResults", () => {
    test("returns favorites absent from the current results", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "banana"), createFavorite("3", "s", "fox")];

      configureSearcher(favorites);
      searcher.search(favorites, "apple");
      expect(idsOf(searcher.invertResults()).sort()).toEqual(["2", "3"]);
    });

    test("replaces the current results with the inverted set", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "banana")];

      configureSearcher(favorites);
      searcher.search(favorites, "apple");
      searcher.invertResults();
      expect(idsOf(searcher.getCurrentSearchResults())).toEqual(["2"]);
    });

    test("enforces the blacklist when off the user's own favorites page", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "banana", "blacklisted")];

      configureSearcher(favorites, { onOwnFavoritesPage: false });
      searcher.search(favorites, "apple");
      expect(idsOf(searcher.invertResults())).toEqual([]);
    });
  });

  describe("appendResults", () => {
    test("appends matched favorites to the current results", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "apple")];

      configureSearcher(favorites);
      searcher.search([favorites[0]], "apple");
      searcher.appendResults([favorites[1]]);
      expect(idsOf(searcher.getCurrentSearchResults())).toEqual(["1", "2"]);
    });
  });

  describe("prependResults", () => {
    test("prepends matched favorites to the current results", () => {
      const favorites = [createFavorite("2", "s", "apple"), createFavorite("1", "s", "apple")];

      configureSearcher(favorites);
      searcher.search([favorites[0]], "apple");
      searcher.prependResults([favorites[1]]);
      expect(idsOf(searcher.getCurrentSearchResults())).toEqual(["1", "2"]);
    });
  });

  describe("shuffleSearchResults", () => {
    test("keeps the same set of results", () => {
      const favorites = [createFavorite("1", "s", "apple"), createFavorite("2", "s", "apple"), createFavorite("3", "s", "apple")];

      configureSearcher(favorites);
      searcher.search(favorites, "apple");
      expect(idsOf(searcher.shuffleSearchResults()).sort()).toEqual(["1", "2", "3"]);
    });
  });
});
