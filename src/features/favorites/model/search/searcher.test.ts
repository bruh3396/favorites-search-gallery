import { DiscreteRating, Rating, SortKey } from "@/types/search";
import { describe, expect, test, vi } from "vitest";
import { Environment } from "@/app/context/environment";
import { Favorite } from "@/types/favorite";
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

function fakePreferences(overrides: ContextOverrides): Preferences {
  return {
    favorites: {
      excludeBlacklist: { value: overrides.excludeBlacklist ?? false },
      allowedRatings: { value: overrides.allowedRatings ?? 7 },
      sortKey: { value: overrides.sortKey ?? "default" },
      sortAscending: { value: overrides.sortAscending ?? false }
    }
  } as unknown as Preferences;
}

function fakeEnvironment(overrides: ContextOverrides): Environment {
  return {
    userIsOnTheirOwnFavoritesPage: overrides.onOwnFavoritesPage ?? true,
    negatedBlacklistedTags: "-blacklisted"
  } as unknown as Environment;
}

function favorite(id: string, rating: string, ...tags: string[]): Favorite {
  const tagSet = new Set(tags);
  return { id, tags: tagSet, consumeTags: () => tagSet, rating: RATINGS[rating], getMetric: () => Number(id) } as unknown as Favorite;
}

function idsOf(results: Favorite[]): string[] {
  return results.map(r => r.id);
}

describe("FavoritesSearcher", () => {
  let searcher: FavoritesSearcher;

  function configureSearcher(favorites: Favorite[], overrides: ContextOverrides = {}): void {
    searcher = new FavoritesSearcher(fakePreferences(overrides), fakeEnvironment(overrides));
    searcher.index(favorites);
  }

  describe("search", () => {
    test("returns the favorites matching the query", () => {
      const favorites = [favorite("1", "s", "cat"), favorite("2", "s", "dog"), favorite("3", "s", "cat")];

      configureSearcher(favorites);
      expect(idsOf(searcher.search(favorites, "cat")).sort()).toEqual(["1", "3"]);
    });

    test("records the query as the current search query", () => {
      const favorites = [favorite("1", "s", "cat")];

      configureSearcher(favorites);
      searcher.search(favorites, "cat");
      expect(searcher.getCurrentSearchQuery()).toBe("cat");
    });

    test("stores the matches as the current search results", () => {
      const favorites = [favorite("1", "s", "cat"), favorite("2", "s", "dog")];

      configureSearcher(favorites);
      searcher.search(favorites, "cat");
      expect(idsOf(searcher.getCurrentSearchResults())).toEqual(["1"]);
    });

    test("notifies the onSearchResultsChanged listener", () => {
      const onChanged = vi.fn();
      const favorites = [favorite("1", "s", "cat"), favorite("2", "s", "dog")];

      configureSearcher(favorites);
      searcher.setup(onChanged);
      searcher.search(favorites, "cat");
      expect(idsOf(onChanged.mock.lastCall?.[0])).toEqual(["1"]);
    });

    test("appends the blacklist tags when the blacklist is active", () => {
      const favorites = [favorite("1", "s", "cat"), favorite("2", "s", "cat", "blacklisted")];

      configureSearcher(favorites, { excludeBlacklist: true });
      expect(idsOf(searcher.search(favorites, "cat"))).toEqual(["1"]);
    });

    test("does not apply the blacklist when it is inactive", () => {
      const favorites = [favorite("1", "s", "cat"), favorite("2", "s", "cat", "blacklisted")];

      configureSearcher(favorites);
      expect(idsOf(searcher.search(favorites, "cat")).sort()).toEqual(["1", "2"]);
    });
  });

  describe("filtering by rating", () => {
    test("keeps only favorites whose rating is allowed", () => {
      const favorites = [favorite("1", "s", "cat"), favorite("2", "e", "cat")];

      configureSearcher(favorites, { allowedRatings: 1 });
      expect(idsOf(searcher.search(favorites, "cat"))).toEqual(["1"]);
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
      const favorites = [favorite("1", "s", "cat"), favorite("3", "s", "cat"), favorite("2", "s", "cat")];

      configureSearcher(favorites, { sortKey, sortAscending });
      expect(idsOf(searcher.search(favorites, "cat"))).toEqual(expected);
    });

    test("does not mutate the input array when reversing an ascending default sort", () => {
      const favorites = [favorite("1", "s", "cat"), favorite("2", "s", "cat"), favorite("3", "s", "cat")];

      configureSearcher(favorites, { sortKey: "default", sortAscending: true });
      searcher.search(favorites, "");
      expect(idsOf(favorites)).toEqual(["1", "2", "3"]);
    });
  });

  describe("reSearch", () => {
    test("re-runs the current query without changing it", () => {
      const favorites = [favorite("1", "s", "cat"), favorite("2", "s", "dog")];

      configureSearcher(favorites);
      searcher.search(favorites, "cat");
      expect(idsOf(searcher.reSearch(favorites))).toEqual(["1"]);
      expect(searcher.getCurrentSearchQuery()).toBe("cat");
    });
  });

  describe("add", () => {
    test("makes newly indexed favorites matchable", () => {
      const favorites = [favorite("1", "s", "cat")];
      const added = favorite("2", "s", "cat");

      configureSearcher(favorites);
      searcher.add([added]);
      expect(idsOf(searcher.search([...favorites, added], "cat")).sort()).toEqual(["1", "2"]);
    });
  });

  describe("update", () => {
    test("reflects corrected tags for a favorite", () => {
      const target = favorite("1", "s", "ct");
      const favorites = [target];
      const oldTerms = new Set(target.tags);

      configureSearcher(favorites);
      target.tags.clear();
      target.tags.add("cat");
      searcher.update([{ doc: target, oldTerms, newTerms: target.tags }]);
      expect(idsOf(searcher.search(favorites, "ct"))).toEqual([]);
      expect(idsOf(searcher.search(favorites, "cat"))).toEqual(["1"]);
    });
  });

  describe("invertResults", () => {
    test("returns favorites absent from the current results", () => {
      const favorites = [favorite("1", "s", "cat"), favorite("2", "s", "dog"), favorite("3", "s", "fox")];

      configureSearcher(favorites);
      searcher.search(favorites, "cat");
      expect(idsOf(searcher.invertResults()).sort()).toEqual(["2", "3"]);
    });

    test("replaces the current results with the inverted set", () => {
      const favorites = [favorite("1", "s", "cat"), favorite("2", "s", "dog")];

      configureSearcher(favorites);
      searcher.search(favorites, "cat");
      searcher.invertResults();
      expect(idsOf(searcher.getCurrentSearchResults())).toEqual(["2"]);
    });

    test("enforces the blacklist when off the user's own favorites page", () => {
      const favorites = [favorite("1", "s", "cat"), favorite("2", "s", "dog", "blacklisted")];

      configureSearcher(favorites, { onOwnFavoritesPage: false });
      searcher.search(favorites, "cat");
      expect(idsOf(searcher.invertResults())).toEqual([]);
    });
  });

  describe("appendResults", () => {
    test("appends matched favorites to the current results", () => {
      const favorites = [favorite("1", "s", "cat"), favorite("2", "s", "cat")];

      configureSearcher(favorites);
      searcher.search([favorites[0]], "cat");
      searcher.appendResults([favorites[1]]);
      expect(idsOf(searcher.getCurrentSearchResults())).toEqual(["1", "2"]);
    });
  });

  describe("prependResults", () => {
    test("prepends matched favorites to the current results", () => {
      const favorites = [favorite("2", "s", "cat"), favorite("1", "s", "cat")];

      configureSearcher(favorites);
      searcher.search([favorites[0]], "cat");
      searcher.prependResults([favorites[1]]);
      expect(idsOf(searcher.getCurrentSearchResults())).toEqual(["1", "2"]);
    });
  });

  describe("shuffleSearchResults", () => {
    test("keeps the same set of results", () => {
      const favorites = [favorite("1", "s", "cat"), favorite("2", "s", "cat"), favorite("3", "s", "cat")];

      configureSearcher(favorites);
      searcher.search(favorites, "cat");
      expect(idsOf(searcher.shuffleSearchResults()).sort()).toEqual(["1", "2", "3"]);
    });
  });
});
