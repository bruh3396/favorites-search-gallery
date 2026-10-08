import { Post, getRatingBit } from "@/core/domain/post/post";
import { Signal, effect } from "@/core/utils/reactive/signal";
import { describe, expect, test } from "vitest";
import { BitSearchEngine } from "@/core/search/engines/bit/bit_search_engine";
import { Emitter } from "@/core/utils/reactive/emitter";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesBlacklist } from "@/core/features/favorites/search/blacklist";
import { FavoritesCollection } from "@/core/features/favorites/collection/collection";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/index";
import { FavoritesSearchSession } from "@/core/features/favorites/search/session";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { PaginationSettings } from "@/core/features/favorites/search/pagination";
import { Preference } from "@/core/utils/reactive/preference";
import { SearchSettings } from "@/core/features/favorites/search/settings";
import { createPost } from "@/testing/post";
import { createSearchSettings } from "@/core/features/favorites/testing/search";

interface Options {
  blacklistedTags?: string;
  settings?: Partial<SearchSettings>;
  pagination?: PaginationSettings;
}

interface Setup {
  session: FavoritesSearchSession;
  collection: FavoritesCollection;
  index: FavoritesSearchIndex;
  searchSettings: Preference<SearchSettings>;
  paginationSettings: Preference<PaginationSettings>;
}

const UNPAGINATED: PaginationSettings = { size: 1_000, infiniteScroll: false };
const PAGES_OF_TWO: PaginationSettings = { size: 2, infiniteScroll: false };

function createPreference<T>(initial: T): Preference<T> {
  const current = new Signal(initial);
  const changed = new Emitter<T>();
  return {
    get value(): T {
      return current.value;
    },
    peek: (): T => current.peek(),
    set: (value: T): void => {
      current.value = value;
      changed.emit(value);
    },
    changed
  };
}

function setup(posts: Post[] = [], { blacklistedTags = "", settings = {}, pagination = UNPAGINATED }: Options = {}): Setup {
  const collection = new FavoritesCollection();
  const index = new FavoritesSearchIndex(new BitSearchEngine<Favorite>(favorite => favorite.tags, (favorite, metric) => favorite.getMetric(metric)));
  const blacklist = new FavoritesBlacklist({ blacklistedTags, isForced: false });
  const searchSettings = createPreference(createSearchSettings(settings));
  const paginationSettings = createPreference(pagination);

  index.rebuild(collection.append(posts));
  const session = new FavoritesSearchSession({ index, blacklist, searchSettings, paginationSettings, randomSource: new MemoryRandomSource([0.25, 0.5, 0.75]) });
  return { session, collection, index, searchSettings, paginationSettings };
}

function getResultIds(session: FavoritesSearchSession): string[] {
  return session.results.value.map(favorite => favorite.id);
}

function getPageIds(session: FavoritesSearchSession): string[] {
  return session.paginationResult.value.favorites.map(favorite => favorite.id);
}

function createTaggedPosts(...tags: string[]): Post[] {
  return tags.map((tag, index) => createPost({ id: String(index + 1), tags: tag }));
}

function createScoredPosts(...scores: number[]): Post[] {
  return scores.map(score => createPost({ id: String(score), score }));
}

function watchResults(session: FavoritesSearchSession): { shown: string[][]; stop: () => void } {
  const shown: string[][] = [];
  const stop = effect(() => {
    shown.push(getResultIds(session));
  });
  return { shown, stop };
}

describe("FavoritesSearchSession", () => {
  test("starts with every indexed favorite", () => {
    expect(getResultIds(setup(createTaggedPosts("apple", "banana")).session)).toEqual(["1", "2"]);
  });

  test("starts from the stored sort", () => {
    const { session } = setup(createScoredPosts(1, 3, 2), { settings: { sortKey: "score" } });

    expect(getResultIds(session)).toEqual(["3", "2", "1"]);
  });

  test("starts from the stored query and inversion", () => {
    const { session } = setup(createTaggedPosts("apple", "banana", "cherry"), { settings: { query: "apple", isInverted: true } });

    expect(getResultIds(session)).toEqual(["2", "3"]);
  });

  test("starts from the stored shuffle", () => {
    const posts = createScoredPosts(...Array.from({ length: 20 }, (_, index) => index + 1));
    const shuffled = getResultIds(setup(posts, { settings: { isShuffled: true, shuffleSeed: 7 } }).session);

    expect(shuffled).toEqual(getResultIds(setup(posts, { settings: { isShuffled: true, shuffleSeed: 7 } }).session));
    expect(shuffled).not.toEqual(getResultIds(setup(posts).session));
  });

  test("hides blacklisted favorites by its blacklist setting", () => {
    const { session } = setup(createTaggedPosts("apple", "cherry"), { blacklistedTags: "apple" });

    expect(getResultIds(session)).toEqual(["1", "2"]);
    session.updateSettings({ isBlacklistEnabled: true });
    expect(getResultIds(session)).toEqual(["2"]);
  });

  describe("submit", () => {
    test("shows the favorites matching the query", () => {
      const { session } = setup(createTaggedPosts("apple", "banana", "apple"));

      session.submit("apple");
      expect(getResultIds(session)).toEqual(["1", "3"]);
    });

    test("shows nothing for an invalid query", () => {
      const { session } = setup(createTaggedPosts("apple"));

      session.submit("( apple");
      expect(getResultIds(session)).toEqual([]);
    });

    test("writes the query and leaves the rest of the settings alone", () => {
      const { session, searchSettings } = setup();

      session.submit("apple");
      expect(searchSettings.value).toEqual(createSearchSettings({ query: "apple" }));
    });

    test("reruns the results once for the same query searched again", () => {
      const { session } = setup(createTaggedPosts("apple"));

      session.submit("apple");
      const { shown, stop } = watchResults(session);

      session.submit("apple");
      expect(shown).toEqual([["1"], ["1"]]);
      stop();
    });

    test("ends a shuffle", () => {
      const { session, searchSettings } = setup();

      session.shuffle();
      session.submit("apple");
      expect(searchSettings.value.isShuffled).toBe(false);
    });
  });

  describe("updateSettings", () => {
    test("writes the given settings and leaves the rest alone", () => {
      const { session, searchSettings } = setup();

      session.updateSettings({ sortKey: "score" });
      session.updateSettings({ isBlacklistEnabled: true });
      expect(searchSettings.value).toEqual(createSearchSettings({ sortKey: "score", isBlacklistEnabled: true }));
    });

    test("orders and filters the results by the new settings", () => {
      const { session } = setup([
        createPost({ id: "1", score: 1, rating: "safe" }),
        createPost({ id: "2", score: 2, rating: "explicit" }),
        createPost({ id: "3", score: 3, rating: "safe" })
      ]);

      session.updateSettings({ sortKey: "score", isSortAscending: false, allowedRatings: getRatingBit("safe") });
      expect(getResultIds(session)).toEqual(["3", "1"]);
    });

    test("keeps the query", () => {
      const { session } = setup(createTaggedPosts("apple", "banana"));

      session.submit("apple");
      session.updateSettings({ sortKey: "score" });
      expect(getResultIds(session)).toEqual(["1"]);
    });

    test("writes the settings and updates the results in one batch", () => {
      const { session, searchSettings } = setup(createScoredPosts(1, 2));
      const runs: Array<[string, string[]]> = [];
      const stop = effect(() => {
        runs.push([searchSettings.value.sortKey, getResultIds(session)]);
      });

      session.updateSettings({ sortKey: "score" });
      expect(runs).toEqual([["favorited", ["1", "2"]], ["score", ["2", "1"]]]);
      stop();
    });

    test.each([
      { change: { sortKey: "favorited" }, isShuffled: false },
      { change: { isSortAscending: true }, isShuffled: false },
      { change: { allowedRatings: getRatingBit("safe") }, isShuffled: true },
      { change: { isBlacklistEnabled: true }, isShuffled: true }
    ] as const)("leaves shuffled $isShuffled after changing $change", ({ change, isShuffled }) => {
      const { session, searchSettings } = setup();

      session.shuffle();
      session.updateSettings(change);
      expect(searchSettings.value.isShuffled).toBe(isShuffled);
    });
  });

  describe("shuffle", () => {
    test("shuffles with a new seed drawn from the random source", () => {
      const { session, searchSettings } = setup();

      session.shuffle();
      expect(searchSettings.value).toMatchObject({ isShuffled: true, shuffleSeed: 2 ** 30 });
    });

    test("draws a new seed each time", () => {
      const { session, searchSettings } = setup();

      session.shuffle();
      session.shuffle();
      expect(searchSettings.value.shuffleSeed).toBe(2 ** 31);
    });

    test("reorders the results", () => {
      const { session } = setup(createScoredPosts(...Array.from({ length: 20 }, (_, index) => index + 1)));
      const before = getResultIds(session);

      session.shuffle();
      expect(getResultIds(session)).not.toEqual(before);
      expect(getResultIds(session).toSorted()).toEqual(before.toSorted());
    });

    test("keeps the query", () => {
      const { session, searchSettings } = setup();

      session.submit("apple");
      session.shuffle();
      expect(searchSettings.value.query).toBe("apple");
    });
  });

  describe("invert", () => {
    test("shows the favorites not matching the query", () => {
      const { session } = setup(createTaggedPosts("apple", "banana"));

      session.submit("apple");
      session.invert();
      expect(getResultIds(session)).toEqual(["2"]);
    });

    test("restores the results when inverted twice", () => {
      const { session } = setup(createTaggedPosts("apple", "banana"));

      session.submit("apple");
      session.invert();
      session.invert();
      expect(getResultIds(session)).toEqual(["1"]);
    });

    test("keeps the inversion for a new query", () => {
      const { session } = setup(createTaggedPosts("apple", "banana"));

      session.invert();
      session.submit("apple");
      expect(getResultIds(session)).toEqual(["2"]);
    });

    test("keeps the blacklist outside the inversion", () => {
      const { session } = setup(createTaggedPosts("apple", "banana", "cherry"), { blacklistedTags: "apple", settings: { isBlacklistEnabled: true } });

      session.submit("banana");
      session.invert();
      expect(getResultIds(session)).toEqual(["3"]);
    });
  });

  describe("paginationResult", () => {
    test("shows the first page of the results", () => {
      const { session } = setup(createTaggedPosts("a", "a", "a", "a", "a"), { pagination: PAGES_OF_TWO });

      expect(getPageIds(session)).toEqual(["1", "2"]);
      expect(session.paginationResult.value).toMatchObject({ pageNumber: 1, totalPages: 3, totalResults: 5 });
    });

    test("pages by the current pagination settings", () => {
      const { session, paginationSettings } = setup(createTaggedPosts("a", "a", "a", "a", "a"), { pagination: PAGES_OF_TWO });

      paginationSettings.set({ size: 3, infiniteScroll: false });
      expect(getPageIds(session)).toEqual(["1", "2", "3"]);
    });

    test("reruns an effect that reads it when the results change", () => {
      const { session, collection, index } = setup(createTaggedPosts("a"), { pagination: PAGES_OF_TWO });
      const seen: string[][] = [];
      const stop = effect(() => {
        seen.push(getPageIds(session));
      });

      index.add(collection.append([createPost({ id: "2", tags: "a" })]));
      expect(seen).toEqual([["1"], ["1", "2"]]);
      stop();
    });

    test("keeps the same favorites array while the results grow past the page", () => {
      const { session, collection, index } = setup(createTaggedPosts("a", "a"), { pagination: PAGES_OF_TWO });
      const seen: Array<readonly Favorite[]> = [];
      const stop = effect(() => {
        seen.push(session.paginationResult.value.favorites);
      });

      index.add(collection.append([createPost({ id: "3", tags: "a" })]));
      expect(session.paginationResult.value.totalResults).toBe(3);
      expect(seen[1]).toBe(seen[0]);
      stop();
    });
  });

  describe("goToPage", () => {
    test("shows the given page", () => {
      const { session } = setup(createTaggedPosts("a", "a", "a", "a", "a"), { pagination: PAGES_OF_TWO });

      session.goToPage(3);
      expect(getPageIds(session)).toEqual(["5"]);
    });

    test.each([
      { pageNumber: 0, current: 1 },
      { pageNumber: -3, current: 1 },
      { pageNumber: 4, current: 3 }
    ])("clamps page $pageNumber to page $current", ({ pageNumber, current }) => {
      const { session } = setup(createTaggedPosts("a", "a", "a", "a", "a"), { pagination: PAGES_OF_TWO });

      session.goToPage(pageNumber);
      expect(session.paginationResult.value.pageNumber).toBe(current);
    });

    test("stays on the page when more favorites arrive", () => {
      const { session, collection, index } = setup(createTaggedPosts("a", "a", "a"), { pagination: PAGES_OF_TWO });

      session.goToPage(2);
      index.add(collection.append([createPost({ id: "4", tags: "a" }), createPost({ id: "5", tags: "a" })]));
      expect(getPageIds(session)).toEqual(["3", "4"]);
    });

    test.each([
      { name: "submit", act: (session: FavoritesSearchSession): void => session.submit("a") },
      { name: "updateSettings", act: (session: FavoritesSearchSession): void => session.updateSettings({ sortKey: "score" }) },
      { name: "invert", act: (session: FavoritesSearchSession): void => session.invert() },
      { name: "shuffle", act: (session: FavoritesSearchSession): void => session.shuffle() }
    ])("goes back to the first page on $name", ({ act }) => {
      const { session } = setup(createTaggedPosts("a", "a", "a", "a", "a"), { pagination: PAGES_OF_TWO });

      session.goToPage(3);
      act(session);
      expect(session.paginationResult.value.pageNumber).toBe(1);
    });

    test("goes back to the first page when the pagination settings change", () => {
      const { session, paginationSettings } = setup(createTaggedPosts("a", "a", "a", "a", "a"), { pagination: PAGES_OF_TWO });

      session.goToPage(2);
      paginationSettings.set({ size: 1, infiniteScroll: false });
      expect(session.paginationResult.value.pageNumber).toBe(1);
    });

    test("shows the new results and the first page together", () => {
      const { session } = setup(createTaggedPosts("a", "b", "a", "b", "a"), { pagination: PAGES_OF_TWO });
      const seen: Array<[number, number]> = [];

      session.goToPage(2);
      const stop = effect(() => {
        const { totalResults, pageNumber } = session.paginationResult.value;

        seen.push([totalResults, pageNumber]);
      });

      session.submit("a");
      expect(seen).toEqual([[5, 2], [3, 1]]);
      stop();
    });
  });

  describe("when favorites are indexed", () => {
    test("keeps the searched results in place and appends the arrivals in arrival order", () => {
      const { session, collection, index } = setup(createScoredPosts(1, 3, 2), { settings: { sortKey: "score" } });

      index.add(collection.append(createScoredPosts(5, 4)));
      expect(getResultIds(session)).toEqual(["3", "2", "1", "5", "4"]);
    });

    test("appends only the arrivals matching the current search", () => {
      const { session, collection, index } = setup(createTaggedPosts("apple"));

      session.submit("banana");
      index.add(collection.append([createPost({ id: "2", tags: "apple" }), createPost({ id: "3", tags: "banana" })]));
      expect(getResultIds(session)).toEqual(["3"]);
    });

    test("leaves the results alone when no arrival matches", () => {
      const { session, collection, index } = setup(createTaggedPosts("apple"));

      session.submit("apple");
      const { shown, stop } = watchResults(session);

      index.add(collection.append([createPost({ id: "2", tags: "banana" })]));
      expect(shown).toEqual([["1"]]);
      stop();
    });

    test("stops appending once disposed", () => {
      const { session, collection, index } = setup();

      session.dispose();
      index.add(collection.append(createTaggedPosts("apple")));
      expect(getResultIds(session)).toEqual([]);
    });
  });

  describe("when the index is rebuilt", () => {
    test("searches again, new favorites first", () => {
      const { session, collection, index } = setup(createTaggedPosts("apple"));

      collection.prependAsNew([createPost({ id: "2" })]);
      index.rebuild(collection.getAll());
      expect(session.results.value.map(favorite => [favorite.id, favorite.isNew])).toEqual([["2", true], ["1", false]]);
    });
  });

  describe("when a favorite is refreshed", () => {
    test("keeps it shown even when it no longer matches", () => {
      const { session, collection, index } = setup(createTaggedPosts("apple"));

      session.submit("apple");
      const refreshed = collection.overwrite(createPost({ id: "1", tags: "banana" }));

      index.update(refreshed === undefined ? [] : [refreshed]);
      expect(getResultIds(session)).toEqual(["1"]);
    });
  });
});
