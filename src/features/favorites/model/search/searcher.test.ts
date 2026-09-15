import { Rating, SortKey } from "@/types/search";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { resetEnvironment, setEnvironment } from "@/app/context/environment";
import { Favorite } from "@/types/favorite";
import { FavoritesSearcher } from "@/features/favorites/model/search/searcher";

interface ConfigOverrides {
  onOwnFavoritesPage?: boolean;
  excludeBlacklist?: boolean;
  allowedRatings?: Rating;
  sortKey?: SortKey;
  sortAscending?: boolean;
}

const preferences = {
  excludeBlacklist: false as boolean,
  allowedRatings: 7 as Rating,
  sortKey: "default" as SortKey,
  sortAscending: false as boolean
};

vi.mock("@/app/context/preferences", () => ({
  Preferences: {
    favorites: {
      excludeBlacklist: {
        get value() {
          return preferences.excludeBlacklist;
        }
      },
      allowedRatings: {
        get value() {
          return preferences.allowedRatings;
        }
      },
      sortKey: {
        get value() {
          return preferences.sortKey;
        }
      },
      sortAscending: {
        get value() {
          return preferences.sortAscending;
        }
      }
    }
  }
}));

vi.mock("@/config/favorites_config", () => ({
  FavoritesConfig: { useBitSearchEngine: false }
}));

const favorite = (id: string, rating: string, ...tags: string[]): Favorite => {
  const tagSet = new Set(tags);
  return { id, tags: tagSet, rating, getMetric: () => Number(id) } as unknown as Favorite;
};

const ids = (results: Favorite[]): string[] => results.map(r => r.id);

const applyOverrides = (overrides: ConfigOverrides = {}): void => {
  setEnvironment({
    USER_IS_ON_THEIR_OWN_FAVORITES_PAGE: overrides.onOwnFavoritesPage ?? true,
    NEGATED_BLACKLISTED_TAGS: "-blacklisted"
  });
  preferences.excludeBlacklist = overrides.excludeBlacklist ?? false;
  preferences.allowedRatings = overrides.allowedRatings ?? 7;
  preferences.sortKey = overrides.sortKey ?? "default";
  preferences.sortAscending = overrides.sortAscending ?? false;
};

describe("FavoritesSearcher", () => {
  let searcher: FavoritesSearcher;

  const withIndexed = (favorites: Favorite[], overrides?: ConfigOverrides): Favorite[] => {
    applyOverrides(overrides);
    searcher = new FavoritesSearcher();
    searcher.index(favorites);
    return favorites;
  };

  beforeEach(() => {
    applyOverrides();
    searcher = new FavoritesSearcher();
  });

  afterEach(() => resetEnvironment());

  describe("search", () => {
    test("returns the favorites matching the query", () => {
      const favorites = withIndexed([favorite("1", "s", "cat"), favorite("2", "s", "dog"), favorite("3", "s", "cat")]);

      expect(ids(searcher.search(favorites, "cat")).sort()).toEqual(["1", "3"]);
    });

    test("records the query as the current search query", () => {
      const favorites = withIndexed([favorite("1", "s", "cat")]);

      searcher.search(favorites, "cat");
      expect(searcher.getCurrentSearchQuery()).toBe("cat");
    });

    test("stores the matches as the current search results", () => {
      const favorites = withIndexed([favorite("1", "s", "cat"), favorite("2", "s", "dog")]);

      searcher.search(favorites, "cat");
      expect(ids(searcher.getCurrentSearchResults())).toEqual(["1"]);
    });

    test("notifies the onSearchResultsChanged listener", () => {
      const onChanged = vi.fn();
      const favorites = withIndexed([favorite("1", "s", "cat"), favorite("2", "s", "dog")]);

      searcher.setup(onChanged);
      searcher.search(favorites, "cat");
      expect(ids(onChanged.mock.lastCall?.[0])).toEqual(["1"]);
    });

    test("appends the blacklist tags when the blacklist is active", () => {
      const favorites = withIndexed([favorite("1", "s", "cat"), favorite("2", "s", "cat", "blacklisted")], { excludeBlacklist: true });

      expect(ids(searcher.search(favorites, "cat"))).toEqual(["1"]);
    });

    test("does not apply the blacklist when it is inactive", () => {
      const favorites = withIndexed([favorite("1", "s", "cat"), favorite("2", "s", "cat", "blacklisted")]);

      expect(ids(searcher.search(favorites, "cat")).sort()).toEqual(["1", "2"]);
    });
  });

  describe("filtering by rating", () => {
    test("keeps only favorites whose rating is allowed", () => {
      const favorites = withIndexed([favorite("1", "s", "cat"), favorite("2", "e", "cat")], { allowedRatings: 1 });

      expect(ids(searcher.search(favorites, "cat"))).toEqual(["1"]);
    });
  });

  describe("sorting", () => {
    test("orders results by the metric, descending by default", () => {
      const favorites = withIndexed([favorite("1", "s", "cat"), favorite("3", "s", "cat"), favorite("2", "s", "cat")], { sortKey: "score" });

      expect(ids(searcher.search(favorites, "cat"))).toEqual(["3", "2", "1"]);
    });

    test("orders ascending when configured", () => {
      const favorites = withIndexed([favorite("1", "s", "cat"), favorite("3", "s", "cat"), favorite("2", "s", "cat")], { sortKey: "score", sortAscending: true });

      expect(ids(searcher.search(favorites, "cat"))).toEqual(["1", "2", "3"]);
    });

    test("leaves results in match order under the default sort key", () => {
      const favorites = withIndexed([favorite("1", "s", "cat"), favorite("3", "s", "cat"), favorite("2", "s", "cat")]);

      expect(ids(searcher.search(favorites, "cat"))).toEqual(["1", "3", "2"]);
    });
  });

  describe("reSearch", () => {
    test("re-runs the current query without changing it", () => {
      const favorites = withIndexed([favorite("1", "s", "cat"), favorite("2", "s", "dog")]);

      searcher.search(favorites, "cat");
      expect(ids(searcher.reSearch(favorites))).toEqual(["1"]);
      expect(searcher.getCurrentSearchQuery()).toBe("cat");
    });
  });

  describe("add", () => {
    test("makes newly indexed favorites matchable", () => {
      const favorites = withIndexed([favorite("1", "s", "cat")]);
      const added = favorite("2", "s", "cat");

      searcher.add([added]);
      expect(ids(searcher.search([...favorites, added], "cat")).sort()).toEqual(["1", "2"]);
    });
  });

  describe("update", () => {
    test("reflects corrected tags for a favorite", () => {
      const target = favorite("1", "s", "ct");
      const favorites = withIndexed([target]);
      const oldTerms = new Set(target.tags);

      target.tags.clear();
      target.tags.add("cat");
      searcher.update([{ doc: target, oldTerms, newTerms: target.tags }]);

      expect(ids(searcher.search(favorites, "ct"))).toEqual([]);
      expect(ids(searcher.search(favorites, "cat"))).toEqual(["1"]);
    });
  });

  describe("invertResults", () => {
    test("returns favorites absent from the current results", () => {
      const favorites = withIndexed([favorite("1", "s", "cat"), favorite("2", "s", "dog"), favorite("3", "s", "fox")]);

      searcher.search(favorites, "cat");
      expect(ids(searcher.invertResults()).sort()).toEqual(["2", "3"]);
    });

    test("replaces the current results with the inverted set", () => {
      const favorites = withIndexed([favorite("1", "s", "cat"), favorite("2", "s", "dog")]);

      searcher.search(favorites, "cat");
      searcher.invertResults();
      expect(ids(searcher.getCurrentSearchResults())).toEqual(["2"]);
    });

    test("enforces the blacklist when off the user's own favorites page", () => {
      const favorites = withIndexed(
        [favorite("1", "s", "cat"), favorite("2", "s", "dog", "blacklisted")],
        { onOwnFavoritesPage: false }
      );

      searcher.search(favorites, "cat");
      expect(ids(searcher.invertResults())).toEqual([]);
    });
  });

  describe("appendResults", () => {
    test("appends matched favorites to the current results", () => {
      const favorites = withIndexed([favorite("1", "s", "cat"), favorite("2", "s", "cat")]);

      searcher.search([favorites[0]], "cat");
      searcher.appendResults([favorites[1]]);
      expect(ids(searcher.getCurrentSearchResults())).toEqual(["1", "2"]);
    });
  });

  describe("prependResults", () => {
    test("prepends matched favorites to the current results", () => {
      const favorites = withIndexed([favorite("2", "s", "cat"), favorite("1", "s", "cat")]);

      searcher.search([favorites[0]], "cat");
      searcher.prependResults([favorites[1]]);
      expect(ids(searcher.getCurrentSearchResults())).toEqual(["1", "2"]);
    });
  });

  describe("shuffleSearchResults", () => {
    test("keeps the same set of results", () => {
      const favorites = withIndexed([favorite("1", "s", "cat"), favorite("2", "s", "cat"), favorite("3", "s", "cat")]);

      searcher.search(favorites, "cat");
      expect(ids(searcher.shuffleSearchResults()).sort()).toEqual(["1", "2", "3"]);
    });
  });
});
