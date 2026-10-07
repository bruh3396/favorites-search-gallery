import { SearchRequest, SearchSettings } from "@/core/features/favorites/types/search";
import { Signal, effect } from "@/core/utils/reactive/signal";
import { describe, expect, test } from "vitest";
import { parseExclusions, parseSearchExpression } from "@/core/search/parsers/search_expression_parser";
import { FavoritesConfiguration } from "@/core/features/favorites/types/favorites";
import { FavoritesSearchFlow } from "@/core/features/favorites/flows/search/search";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { Preference } from "@/core/utils/reactive/preference";
import { SearchExpression } from "@/core/search/expressions/search_expression";
import { createSearchSettings } from "@/core/features/favorites/testing/request";
import { getRatingBit } from "@/core/domain/post/post";

function createPreference<T>(initial: T): Preference<T> {
  const current = new Signal(initial);
  return {
    get value(): T {
      return current.value;
    },
    peek: (): T => current.peek(),
    set: (value: T): void => {
      current.value = value;
    }
  };
}

interface Options extends FavoritesConfiguration {
  isBlacklistEnabled: boolean;
}

interface Setup {
  flow: FavoritesSearchFlow;
  searchSettings: Preference<SearchSettings>;
  searched: Signal<SearchRequest[]>;
  page: Signal<number>;
}

const OWN_FAVORITES: Options = { userOwnsFavorites: true, blacklistedTags: "", isBlacklistEnabled: false };

function setup({ isBlacklistEnabled, ...configuration }: Options = OWN_FAVORITES): Setup {
  const searchSettings = createPreference(createSearchSettings({ isBlacklistEnabled }));
  const searched = new Signal<SearchRequest[]>([]);
  const page = new Signal(3);
  const search = (): void => {
    searched.value = [...searched.peek(), flow.request.peek()];
  };
  const goToFirstPage = (): void => {
    page.value = 1;
  };
  const randomSource = new MemoryRandomSource([0.25, 0.5, 0.75]);
  const flow = new FavoritesSearchFlow(configuration, { searchSettings, randomSource, search, goToFirstPage });
  return { flow, searchSettings, searched, page };
}

const EVERYTHING = parseSearchExpression("");
const BLACKLIST = parseExclusions("apple banana") as SearchExpression;
const BLACKLISTED = SearchExpression.and([BLACKLIST, EVERYTHING]);

describe("FavoritesSearchFlow", () => {
  test("starts unshuffled with a seed drawn from the random source", () => {
    const { flow } = setup();

    expect(flow.request.value).toMatchObject({ isShuffled: false, shuffleSeed: 2 ** 30 });
  });

  test("applies the blacklist on someone else's favorites even when it is disabled", () => {
    const { flow } = setup({ userOwnsFavorites: false, blacklistedTags: "apple banana", isBlacklistEnabled: false });

    expect(flow.request.value.expression).toEqual(BLACKLISTED);
  });

  test("applies the blacklist on the user's own favorites only while it is enabled", () => {
    const { flow } = setup({ userOwnsFavorites: true, blacklistedTags: "apple banana", isBlacklistEnabled: false });

    expect(flow.request.value.expression).toEqual(EVERYTHING);
    flow.updateSettings({ isBlacklistEnabled: true });
    expect(flow.request.value.expression).toEqual(BLACKLISTED);
  });

  test("leaves the expression alone for an empty blacklist", () => {
    const { flow } = setup({ userOwnsFavorites: false, blacklistedTags: "", isBlacklistEnabled: true });

    expect(flow.request.value.expression).toEqual(EVERYTHING);
  });

  describe("search", () => {
    test("parses the query into the request", () => {
      const { flow } = setup();

      flow.search("apple");
      expect(flow.request.value.expression).toEqual(parseSearchExpression("apple"));
    });

    test("leaves no expression for an invalid query", () => {
      const { flow } = setup();

      flow.search("( apple");
      expect(flow.request.value.expression).toBeUndefined();
    });

    test("leaves the settings alone", () => {
      const { flow, searchSettings } = setup();

      flow.search("apple");
      expect(searchSettings.value).toEqual(createSearchSettings());
    });

    test("publishes the request, searches with it and goes to the first page in one batch", () => {
      const { flow, searched, page } = setup();
      const runs: Array<[SearchRequest, number, number]> = [];
      const stop = effect(() => {
        runs.push([flow.request.value, searched.value.length, page.value]);
      });

      flow.search("apple");
      expect(runs.map(([, searchCount, shownPage]) => [searchCount, shownPage])).toEqual([[0, 3], [1, 1]]);
      expect(runs[1]?.[0].expression).toEqual(parseSearchExpression("apple"));
      expect(searched.value).toEqual([flow.request.value]);
      stop();
    });

    test("runs again for the same query", () => {
      const { flow, searched, page } = setup();
      const requests: SearchRequest[] = [];
      const stop = effect(() => {
        requests.push(flow.request.value);
      });

      flow.search("apple");
      page.value = 3;
      flow.search("apple");
      expect(requests).toHaveLength(3);
      expect(searched.value).toHaveLength(2);
      expect(page.value).toBe(1);
      stop();
    });

    test("ends a shuffle", () => {
      const { flow } = setup();

      flow.shuffle();
      flow.search("apple");
      expect(flow.request.value.isShuffled).toBe(false);
    });
  });

  describe("updateSettings", () => {
    test("writes the given settings and leaves the rest alone", () => {
      const { flow, searchSettings } = setup();

      flow.updateSettings({ sortKey: "score" });
      flow.updateSettings({ isBlacklistEnabled: true });
      expect(searchSettings.value).toEqual(createSearchSettings({ sortKey: "score", isBlacklistEnabled: true }));
    });

    test("puts the settings into the request", () => {
      const { flow } = setup();

      flow.updateSettings({ sortKey: "score", isSortAscending: true, allowedRatings: getRatingBit("safe") });
      expect(flow.request.value).toMatchObject({ sortKey: "score", isSortAscending: true, allowedRatings: getRatingBit("safe") });
    });

    test("keeps the query", () => {
      const { flow } = setup();

      flow.search("apple");
      flow.updateSettings({ sortKey: "score" });
      expect(flow.request.value.expression).toEqual(parseSearchExpression("apple"));
    });

    test("publishes the request, searches with it and goes to the first page in one batch", () => {
      const { flow, searched, page } = setup();
      const runs: Array<[string, number, number]> = [];
      const stop = effect(() => {
        runs.push([flow.request.value.sortKey, searched.value.length, page.value]);
      });

      flow.updateSettings({ sortKey: "score" });
      expect(runs).toEqual([["favorited", 0, 3], ["score", 1, 1]]);
      stop();
    });

    test("runs again for settings that are already current", () => {
      const { flow, searched, page } = setup();

      flow.updateSettings({ sortKey: "favorited" });
      expect(searched.value).toHaveLength(1);
      expect(page.value).toBe(1);
    });

    test.each([
      { change: { sortKey: "favorited" }, isShuffled: false },
      { change: { isSortAscending: true }, isShuffled: false },
      { change: { allowedRatings: getRatingBit("safe") }, isShuffled: true },
      { change: { isBlacklistEnabled: true }, isShuffled: true }
    ] as const)("leaves shuffled $isShuffled after changing $change", ({ change, isShuffled }) => {
      const { flow } = setup();

      flow.shuffle();
      flow.updateSettings(change);
      expect(flow.request.value.isShuffled).toBe(isShuffled);
    });
  });

  describe("shuffle", () => {
    test("shuffles with a new seed drawn from the random source", () => {
      const { flow } = setup();

      flow.shuffle();
      expect(flow.request.value).toMatchObject({ isShuffled: true, shuffleSeed: 2 ** 31 });
    });

    test("draws a new seed each time", () => {
      const { flow } = setup();

      flow.shuffle();
      flow.shuffle();
      expect(flow.request.value.shuffleSeed).toBe(3 * (2 ** 30));
    });

    test("leaves the settings alone", () => {
      const { flow, searchSettings } = setup();

      flow.shuffle();
      expect(searchSettings.value).toEqual(createSearchSettings());
    });

    test("searches and goes to the first page", () => {
      const { flow, searched, page } = setup();

      flow.shuffle();
      expect(searched.value).toHaveLength(1);
      expect(page.value).toBe(1);
    });
  });

  describe("invert", () => {
    test("goes to the first page", () => {
      const { flow, page } = setup();

      flow.invert();
      expect(page.value).toBe(1);
    });

    test("negates the query", () => {
      const { flow } = setup();

      flow.search("apple");
      flow.invert();
      expect(flow.request.value.expression).toEqual(SearchExpression.not(parseSearchExpression("apple")));
    });

    test("restores the query when inverted twice", () => {
      const { flow } = setup();

      flow.search("apple");
      flow.invert();
      flow.invert();
      expect(flow.request.value.expression).toEqual(parseSearchExpression("apple"));
    });

    test("keeps the inversion for a new query", () => {
      const { flow } = setup();

      flow.invert();
      flow.search("apple");
      expect(flow.request.value.expression).toEqual(SearchExpression.not(parseSearchExpression("apple")));
    });

    test("puts the blacklist outside the negation", () => {
      const { flow } = setup({ userOwnsFavorites: false, blacklistedTags: "apple banana", isBlacklistEnabled: false });

      flow.invert();
      expect(flow.request.value.expression).toEqual(SearchExpression.and([BLACKLIST, SearchExpression.not(EVERYTHING)]));
    });
  });
});
