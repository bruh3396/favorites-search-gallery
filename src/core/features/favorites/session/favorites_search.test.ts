import { Post } from "@/core/domain/post/post";
import { toRatingMask } from "@/core/domain/post/rating_mask";
import { describe, expect, test } from "vitest";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesSearch } from "@/core/features/favorites/session/favorites_search";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { FavoritesSearchSettings } from "@/core/features/favorites/search/favorites_search_settings";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { createPost } from "@/testing/post";
import { buildFavoritesSearchSettings } from "@/core/features/favorites/testing/favorites_search_settings_builder";
import { effect } from "@/core/utils/reactive/signal";
import { StringInterner } from "@/core/utils/string/string_interner";

interface Options {
  blacklistedTags?: readonly string[];
  settings?: Partial<FavoritesSearchSettings>;
  isStarted?: boolean;
}

interface Setup {
  search: FavoritesSearch;
  collection: FavoritesCollection;
  index: FavoritesSearchIndex;
}

function setup(posts: Post[] = [], { blacklistedTags = [], settings = {}, isStarted = true }: Options = {}): Setup {
  const collection = new FavoritesCollection(new StringInterner());
  const index = new FavoritesSearchIndex(new StringInterner());
  const blacklist = new FavoritesBlacklist({ blacklistedTags, force: false });

  index.rebuild(collection.append(posts));
  const search = new FavoritesSearch(
    { settings: buildFavoritesSearchSettings(settings) },
    { searchIndex: index, blacklist, randomSource: new MemoryRandomSource([0.25, 0.5, 0.75]) }
  );

  if (isStarted) {
    search.start();
  }
  return { search, collection, index };
}

function getResultIds(search: FavoritesSearch): string[] {
  return search.results.value.map(favorite => favorite.id);
}

function createTaggedPosts(...tags: string[]): Post[] {
  return tags.map((tag, index) => createPost({ id: String(index + 1), tags: tag }));
}

function createScoredPosts(...scores: number[]): Post[] {
  return scores.map(score => createPost({ id: String(score), score }));
}

function watchResults(search: FavoritesSearch): { shown: string[][]; stop: () => void } {
  const shown: string[][] = [];
  const stop = effect(() => {
    shown.push(getResultIds(search));
  });
  return { shown, stop };
}

describe("FavoritesSearch", () => {
  test("starts with every indexed favorite", () => {
    expect(getResultIds(setup(createTaggedPosts("apple", "banana")).search)).toEqual(["1", "2"]);
  });

  test("starts from the stored sort", () => {
    const { search } = setup(createScoredPosts(1, 3, 2), { settings: { sortKey: "score" } });

    expect(getResultIds(search)).toEqual(["3", "2", "1"]);
  });

  test("starts from the stored query and inversion", () => {
    const { search } = setup(createTaggedPosts("apple", "banana", "cherry"), { settings: { query: "apple", isInverted: true } });

    expect(getResultIds(search)).toEqual(["2", "3"]);
  });

  test("starts from the stored shuffle", () => {
    const posts = createScoredPosts(...Array.from({ length: 20 }, (_, index) => index + 1));
    const shuffled = getResultIds(setup(posts, { settings: { isShuffled: true, shuffleSeed: 7 } }).search);

    expect(shuffled).toEqual(getResultIds(setup(posts, { settings: { isShuffled: true, shuffleSeed: 7 } }).search));
    expect(shuffled).not.toEqual(getResultIds(setup(posts).search));
  });

  test("hides blacklisted favorites by its blacklist setting", () => {
    const { search } = setup(createTaggedPosts("apple", "cherry"), { blacklistedTags: ["apple"] });

    expect(getResultIds(search)).toEqual(["1", "2"]);
    search.updateSettings({ isBlacklistEnabled: true });
    expect(getResultIds(search)).toEqual(["2"]);
  });

  describe("start", () => {
    test("shows no results before the search starts", () => {
      const { search, collection, index } = setup(createTaggedPosts("apple"), { isStarted: false });

      index.add(collection.append([createPost({ id: "2" })]));
      index.rebuild(collection.getAll());
      expect(getResultIds(search)).toEqual([]);
    });

    test("searches the whole index once started", () => {
      const { search, collection, index } = setup(createTaggedPosts("apple"), { isStarted: false });

      index.add(collection.append([createPost({ id: "2" })]));
      search.start();
      expect(getResultIds(search)).toEqual(["1", "2"]);
    });

    test("searches only the first time it is called", () => {
      const { search } = setup(createTaggedPosts("apple"));
      const { shown, stop } = watchResults(search);

      search.start();
      expect(shown).toEqual([["1"]]);
      stop();
    });

    test("changes the settings without searching before the search starts", () => {
      const { search } = setup(createTaggedPosts("apple", "banana"), { isStarted: false });

      search.submit("apple");
      expect(search.settings.value.query).toBe("apple");
      expect(getResultIds(search)).toEqual([]);

      search.start();
      expect(getResultIds(search)).toEqual(["1"]);
    });
  });

  describe("submit", () => {
    test("shows the favorites matching the query", () => {
      const { search } = setup(createTaggedPosts("apple", "banana", "apple"));

      search.submit("apple");
      expect(getResultIds(search)).toEqual(["1", "3"]);
    });

    test("shows nothing for an invalid query", () => {
      const { search } = setup(createTaggedPosts("apple"));

      search.submit("( apple");
      expect(getResultIds(search)).toEqual([]);
    });

    test("writes the query and leaves the rest of the settings alone", () => {
      const { search } = setup();

      search.submit("apple");
      expect(search.settings.value).toEqual(buildFavoritesSearchSettings({ query: "apple" }));
    });

    test("reruns the results once for the same query searched again", () => {
      const { search } = setup(createTaggedPosts("apple"));

      search.submit("apple");
      const { shown, stop } = watchResults(search);

      search.submit("apple");
      expect(shown).toEqual([["1"], ["1"]]);
      stop();
    });

    test("ends a shuffle", () => {
      const { search } = setup();

      search.shuffle();
      search.submit("apple");
      expect(search.settings.value.isShuffled).toBe(false);
    });
  });

  describe("updateSettings", () => {
    test("writes the given settings and leaves the rest alone", () => {
      const { search } = setup();

      search.updateSettings({ sortKey: "score" });
      search.updateSettings({ isBlacklistEnabled: true });
      expect(search.settings.value).toEqual(buildFavoritesSearchSettings({ sortKey: "score", isBlacklistEnabled: true }));
    });

    test("orders and filters the results by the new settings", () => {
      const { search } = setup([
        createPost({ id: "1", score: 1, rating: "safe" }),
        createPost({ id: "2", score: 2, rating: "explicit" }),
        createPost({ id: "3", score: 3, rating: "safe" })
      ]);

      search.updateSettings({ sortKey: "score", isSortAscending: false, allowedRatings: toRatingMask("safe") });
      expect(getResultIds(search)).toEqual(["3", "1"]);
    });

    test("keeps the query", () => {
      const { search } = setup(createTaggedPosts("apple", "banana"));

      search.submit("apple");
      search.updateSettings({ sortKey: "score" });
      expect(getResultIds(search)).toEqual(["1"]);
    });

    test("writes the settings and updates the results in one batch", () => {
      const { search } = setup(createScoredPosts(1, 2));
      const runs: Array<[string, string[]]> = [];
      const stop = effect(() => {
        runs.push([search.settings.value.sortKey, getResultIds(search)]);
      });

      search.updateSettings({ sortKey: "score" });
      expect(runs).toEqual([["favorited", ["1", "2"]], ["score", ["2", "1"]]]);
      stop();
    });

    test.each([
      { change: { sortKey: "favorited" }, isShuffled: false },
      { change: { isSortAscending: true }, isShuffled: false },
      { change: { allowedRatings: toRatingMask("safe") }, isShuffled: true },
      { change: { isBlacklistEnabled: true }, isShuffled: true }
    ] as const)("leaves shuffled $isShuffled after changing $change", ({ change, isShuffled }) => {
      const { search } = setup();

      search.shuffle();
      search.updateSettings(change);
      expect(search.settings.value.isShuffled).toBe(isShuffled);
    });
  });

  describe("shuffle", () => {
    test("shuffles with a new seed drawn from the random source", () => {
      const { search } = setup();

      search.shuffle();
      expect(search.settings.value).toMatchObject({ isShuffled: true, shuffleSeed: 2 ** 30 });
    });

    test("draws a new seed each time", () => {
      const { search } = setup();

      search.shuffle();
      search.shuffle();
      expect(search.settings.value.shuffleSeed).toBe(2 ** 31);
    });

    test("reorders the results", () => {
      const { search } = setup(createScoredPosts(...Array.from({ length: 20 }, (_, index) => index + 1)));
      const before = getResultIds(search);

      search.shuffle();
      expect(getResultIds(search)).not.toEqual(before);
      expect(getResultIds(search).toSorted()).toEqual(before.toSorted());
    });

    test("keeps the query", () => {
      const { search } = setup();

      search.submit("apple");
      search.shuffle();
      expect(search.settings.value.query).toBe("apple");
    });
  });

  describe("invert", () => {
    test("shows the favorites not matching the query", () => {
      const { search } = setup(createTaggedPosts("apple", "banana"));

      search.submit("apple");
      search.invert();
      expect(getResultIds(search)).toEqual(["2"]);
    });

    test("restores the results when inverted twice", () => {
      const { search } = setup(createTaggedPosts("apple", "banana"));

      search.submit("apple");
      search.invert();
      search.invert();
      expect(getResultIds(search)).toEqual(["1"]);
    });

    test("keeps the inversion for a new query", () => {
      const { search } = setup(createTaggedPosts("apple", "banana"));

      search.invert();
      search.submit("apple");
      expect(getResultIds(search)).toEqual(["2"]);
    });

    test("keeps the blacklist outside the inversion", () => {
      const { search } = setup(createTaggedPosts("apple", "banana", "cherry"), { blacklistedTags: ["apple"], settings: { isBlacklistEnabled: true } });

      search.submit("banana");
      search.invert();
      expect(getResultIds(search)).toEqual(["3"]);
    });
  });

  describe("clearFilters", () => {
    test("shows every favorite again", () => {
      const { search } = setup([
        createPost({ id: "1", tags: "apple", rating: "safe" }),
        createPost({ id: "2", tags: "banana", rating: "explicit" })
      ], { blacklistedTags: ["apple"] });

      search.updateSettings({ allowedRatings: toRatingMask("safe"), isBlacklistEnabled: true });
      search.submit("banana");
      search.invert();
      search.clearFilters();
      expect(getResultIds(search)).toEqual(["1", "2"]);
    });

    test("keeps the sort and the shuffle", () => {
      const { search } = setup();

      search.updateSettings({ sortKey: "score", isSortAscending: true });
      search.shuffle();
      search.submit("apple");
      search.shuffle();
      search.clearFilters();
      expect(search.settings.value).toEqual(buildFavoritesSearchSettings({ sortKey: "score", isSortAscending: true, isShuffled: true, shuffleSeed: 2 ** 31 }));
    });
  });

  describe("searched", () => {
    test.each([
      { name: "submit", act: (search: FavoritesSearch): void => search.submit("a") },
      { name: "updateSettings", act: (search: FavoritesSearch): void => search.updateSettings({ sortKey: "score" }) },
      { name: "invert", act: (search: FavoritesSearch): void => search.invert() },
      { name: "shuffle", act: (search: FavoritesSearch): void => search.shuffle() },
      { name: "clearFilters", act: (search: FavoritesSearch): void => search.clearFilters() }
    ])("fires once on $name", ({ act }) => {
      const { search } = setup();
      let count = 0;

      search.searched.on(() => {
        count += 1;
      });
      act(search);
      expect(count).toBe(1);
    });

    test("fires after the new results are in", () => {
      const { search } = setup(createTaggedPosts("apple", "banana"));
      const seen: string[][] = [];

      search.searched.on(() => seen.push(search.results.peek().map(favorite => favorite.id)));
      search.submit("apple");
      expect(seen).toEqual([["1"]]);
    });

    test("stays silent when favorites are indexed or the index is rebuilt", () => {
      const { search, collection, index } = setup(createTaggedPosts("apple"));
      let count = 0;

      search.searched.on(() => {
        count += 1;
      });
      index.add(collection.append([createPost({ id: "2" })]));
      index.rebuild(collection.getAll());
      expect(count).toBe(0);
    });
  });

  describe("when favorites are indexed", () => {
    test("keeps the searched results in place and appends the arrivals in arrival order", () => {
      const { search, collection, index } = setup(createScoredPosts(1, 3, 2), { settings: { sortKey: "score" } });

      index.add(collection.append(createScoredPosts(5, 4)));
      expect(getResultIds(search)).toEqual(["3", "2", "1", "5", "4"]);
    });

    test("appends only the arrivals matching the current search", () => {
      const { search, collection, index } = setup(createTaggedPosts("apple"));

      search.submit("banana");
      index.add(collection.append([createPost({ id: "2", tags: "apple" }), createPost({ id: "3", tags: "banana" })]));
      expect(getResultIds(search)).toEqual(["3"]);
    });

    test("leaves the results alone when no arrival matches", () => {
      const { search, collection, index } = setup(createTaggedPosts("apple"));

      search.submit("apple");
      const { shown, stop } = watchResults(search);

      index.add(collection.append([createPost({ id: "2", tags: "banana" })]));
      expect(shown).toEqual([["1"]]);
      stop();
    });

    test("stops appending once disposed", () => {
      const { search, collection, index } = setup();

      search.dispose();
      index.add(collection.append(createTaggedPosts("apple")));
      expect(getResultIds(search)).toEqual([]);
    });
  });

  describe("when the index is rebuilt", () => {
    test("searches again, new favorites first", () => {
      const { search, collection, index } = setup(createTaggedPosts("apple"));

      collection.prependAsNew([createPost({ id: "2" })]);
      index.rebuild(collection.getAll());
      expect(search.results.value.map(favorite => [favorite.id, favorite.isNew])).toEqual([["2", true], ["1", false]]);
    });
  });

  describe("when a favorite is refreshed", () => {
    test("keeps it shown even when it no longer matches", () => {
      const { search, collection, index } = setup(createTaggedPosts("apple"));
      const [favorite] = collection.getAll();

      search.submit("apple");
      collection.overwrite(createPost({ id: "1", tags: "banana" }));
      index.update([{ doc: favorite, oldTerms: new Set(["apple"]), newTerms: favorite.tags }]);
      expect(getResultIds(search)).toEqual(["1"]);
    });
  });
});
