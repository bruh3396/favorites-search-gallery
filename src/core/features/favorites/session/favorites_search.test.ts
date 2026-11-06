import { describe, expect, test } from "vitest";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesSearch } from "@/core/features/favorites/session/favorites_search";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { FavoritesSearchSettings } from "@/core/features/favorites/search/favorites_search_settings";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/memory_random_source";
import { Post } from "@/core/domain/post/post";
import { StringInterner } from "@/core/utils/string/string_interner";
import { buildFavoritesSearchSettings } from "@/core/features/favorites/testing/favorites_search_settings_builder";
import { createPost } from "@/testing/post";
import { effect } from "@/core/utils/reactive/signal";
import { toRatingMask } from "@/core/domain/post/rating_mask";

interface Options {
  blacklistedTags?: readonly string[];
  partialFavoritesSearchSettings?: Partial<FavoritesSearchSettings>;
  isStarted?: boolean;
}

interface Setup {
  favoritesSearch: FavoritesSearch;
  favoritesCollection: FavoritesCollection;
  favoritesSearchIndex: FavoritesSearchIndex;
}

function setup(posts: Post[] = [], { blacklistedTags = [], partialFavoritesSearchSettings = {}, isStarted = true }: Options = {}): Setup {
  const favoritesCollection = new FavoritesCollection(new StringInterner());
  const favoritesSearchIndex = new FavoritesSearchIndex(new StringInterner());
  const favoritesBlacklist = new FavoritesBlacklist({ blacklistedTags, force: false });

  favoritesSearchIndex.rebuild(favoritesCollection.append(posts));
  const favoritesSearch = new FavoritesSearch(
    { favoritesSearchSettings: buildFavoritesSearchSettings(partialFavoritesSearchSettings) },
    { favoritesSearchIndex, favoritesBlacklist, randomSource: new MemoryRandomSource([0.25, 0.5, 0.75]) }
  );

  if (isStarted) {
    favoritesSearch.start();
  }
  return { favoritesSearch, favoritesCollection, favoritesSearchIndex };
}

function getResultPostIds(favoritesSearch: FavoritesSearch): string[] {
  return favoritesSearch.matchedFavorites.value.map(favorite => favorite.id);
}

function createTaggedPosts(...tags: string[]): Post[] {
  return tags.map((tag, index) => createPost({ id: String(index + 1), tags: tag }));
}

function createScoredPosts(...scores: number[]): Post[] {
  return scores.map(score => createPost({ id: String(score), score }));
}

function watchResults(favoritesSearch: FavoritesSearch): { shown: string[][]; stop: () => void } {
  const shown: string[][] = [];
  const stop = effect(() => {
    shown.push(getResultPostIds(favoritesSearch));
  });
  return { shown, stop };
}

describe("FavoritesSearch", () => {
  test("starts with every indexed favorite", () => {
    expect(getResultPostIds(setup(createTaggedPosts("apple", "banana")).favoritesSearch)).toEqual(["1", "2"]);
  });

  test("starts from the stored sort", () => {
    const { favoritesSearch } = setup(createScoredPosts(1, 3, 2), { partialFavoritesSearchSettings: { sortKey: "score" } });

    expect(getResultPostIds(favoritesSearch)).toEqual(["3", "2", "1"]);
  });

  test("starts from the stored query and inversion", () => {
    const { favoritesSearch } = setup(createTaggedPosts("apple", "banana", "cherry"), { partialFavoritesSearchSettings: { query: "apple", isInverted: true } });

    expect(getResultPostIds(favoritesSearch)).toEqual(["2", "3"]);
  });

  test("starts from the stored shuffle", () => {
    const posts = createScoredPosts(...Array.from({ length: 20 }, (_, index) => index + 1));
    const shuffled = getResultPostIds(setup(posts, { partialFavoritesSearchSettings: { isShuffled: true, shuffleSeed: 7 } }).favoritesSearch);

    expect(shuffled).toEqual(getResultPostIds(setup(posts, { partialFavoritesSearchSettings: { isShuffled: true, shuffleSeed: 7 } }).favoritesSearch));
    expect(shuffled).not.toEqual(getResultPostIds(setup(posts).favoritesSearch));
  });

  test("hides blacklisted favorites by its blacklist setting", () => {
    const { favoritesSearch } = setup(createTaggedPosts("apple", "cherry"), { blacklistedTags: ["apple"] });

    expect(getResultPostIds(favoritesSearch)).toEqual(["1", "2"]);
    favoritesSearch.updateSettings({ isBlacklistEnabled: true });
    expect(getResultPostIds(favoritesSearch)).toEqual(["2"]);
  });

  describe("start", () => {
    test("shows no results before the search starts", () => {
      const { favoritesSearch, favoritesCollection, favoritesSearchIndex } = setup(createTaggedPosts("apple"), { isStarted: false });

      favoritesSearchIndex.add(favoritesCollection.append([createPost({ id: "2" })]));
      favoritesSearchIndex.rebuild(favoritesCollection.getAll());
      expect(getResultPostIds(favoritesSearch)).toEqual([]);
    });

    test("searches the whole index once started", () => {
      const { favoritesSearch, favoritesCollection, favoritesSearchIndex } = setup(createTaggedPosts("apple"), { isStarted: false });

      favoritesSearchIndex.add(favoritesCollection.append([createPost({ id: "2" })]));
      favoritesSearch.start();
      expect(getResultPostIds(favoritesSearch)).toEqual(["1", "2"]);
    });

    test("searches only the first time it is called", () => {
      const { favoritesSearch } = setup(createTaggedPosts("apple"));
      const { shown, stop } = watchResults(favoritesSearch);

      favoritesSearch.start();
      expect(shown).toEqual([["1"]]);
      stop();
    });

    test("changes the settings without searching before the search starts", () => {
      const { favoritesSearch } = setup(createTaggedPosts("apple", "banana"), { isStarted: false });

      favoritesSearch.submit("apple");
      expect(favoritesSearch.settings.value.query).toBe("apple");
      expect(getResultPostIds(favoritesSearch)).toEqual([]);

      favoritesSearch.start();
      expect(getResultPostIds(favoritesSearch)).toEqual(["1"]);
    });
  });

  describe("submit", () => {
    test("shows the favorites matching the query", () => {
      const { favoritesSearch } = setup(createTaggedPosts("apple", "banana", "apple"));

      favoritesSearch.submit("apple");
      expect(getResultPostIds(favoritesSearch)).toEqual(["1", "3"]);
    });

    test("shows nothing for an invalid query", () => {
      const { favoritesSearch } = setup(createTaggedPosts("apple"));

      favoritesSearch.submit("( apple");
      expect(getResultPostIds(favoritesSearch)).toEqual([]);
    });

    test("writes the query and leaves the rest of the settings alone", () => {
      const { favoritesSearch } = setup();

      favoritesSearch.submit("apple");
      expect(favoritesSearch.settings.value).toEqual(buildFavoritesSearchSettings({ query: "apple" }));
    });

    test("reruns the results once for the same query searched again", () => {
      const { favoritesSearch } = setup(createTaggedPosts("apple"));

      favoritesSearch.submit("apple");
      const { shown, stop } = watchResults(favoritesSearch);

      favoritesSearch.submit("apple");
      expect(shown).toEqual([["1"], ["1"]]);
      stop();
    });

    test("ends a shuffle", () => {
      const { favoritesSearch } = setup();

      favoritesSearch.shuffle();
      favoritesSearch.submit("apple");
      expect(favoritesSearch.settings.value.isShuffled).toBe(false);
    });
  });

  describe("updateSettings", () => {
    test("writes the given settings and leaves the rest alone", () => {
      const { favoritesSearch } = setup();

      favoritesSearch.updateSettings({ sortKey: "score" });
      favoritesSearch.updateSettings({ isBlacklistEnabled: true });
      expect(favoritesSearch.settings.value).toEqual(buildFavoritesSearchSettings({ sortKey: "score", isBlacklistEnabled: true }));
    });

    test("orders and filters the results by the new settings", () => {
      const { favoritesSearch } = setup([
        createPost({ id: "1", score: 1, rating: "safe" }),
        createPost({ id: "2", score: 2, rating: "explicit" }),
        createPost({ id: "3", score: 3, rating: "safe" })
      ]);

      favoritesSearch.updateSettings({ sortKey: "score", isSortAscending: false, allowedRatings: toRatingMask("safe") });
      expect(getResultPostIds(favoritesSearch)).toEqual(["3", "1"]);
    });

    test("keeps the query", () => {
      const { favoritesSearch } = setup(createTaggedPosts("apple", "banana"));

      favoritesSearch.submit("apple");
      favoritesSearch.updateSettings({ sortKey: "score" });
      expect(getResultPostIds(favoritesSearch)).toEqual(["1"]);
    });

    test("writes the settings and updates the results in one batch", () => {
      const { favoritesSearch } = setup(createScoredPosts(1, 2));
      const runs: Array<[string, string[]]> = [];
      const stop = effect(() => {
        runs.push([favoritesSearch.settings.value.sortKey, getResultPostIds(favoritesSearch)]);
      });

      favoritesSearch.updateSettings({ sortKey: "score" });
      expect(runs).toEqual([["favorited", ["1", "2"]], ["score", ["2", "1"]]]);
      stop();
    });

    test.each([
      { change: { sortKey: "favorited" }, isShuffled: false },
      { change: { isSortAscending: true }, isShuffled: false },
      { change: { allowedRatings: toRatingMask("safe") }, isShuffled: true },
      { change: { isBlacklistEnabled: true }, isShuffled: true }
    ] as const)("leaves shuffled $isShuffled after changing $change", ({ change, isShuffled }) => {
      const { favoritesSearch } = setup();

      favoritesSearch.shuffle();
      favoritesSearch.updateSettings(change);
      expect(favoritesSearch.settings.value.isShuffled).toBe(isShuffled);
    });

    test("draws a new seed each time the random sort is picked", () => {
      const { favoritesSearch } = setup();

      favoritesSearch.updateSettings({ sortKey: "random" });
      expect(favoritesSearch.settings.value.shuffleSeed).toBe(2 ** 30);
      favoritesSearch.updateSettings({ sortKey: "random" });
      expect(favoritesSearch.settings.value.shuffleSeed).toBe(2 ** 31);
    });

    test("keeps the random order when a filter changes", () => {
      const { favoritesSearch } = setup();

      favoritesSearch.updateSettings({ sortKey: "random" });
      favoritesSearch.updateSettings({ allowedRatings: toRatingMask("safe") });
      expect(favoritesSearch.settings.value.shuffleSeed).toBe(2 ** 30);
    });
  });

  describe("shuffle", () => {
    test("shuffles with a new seed drawn from the random source", () => {
      const { favoritesSearch } = setup();

      favoritesSearch.shuffle();
      expect(favoritesSearch.settings.value).toMatchObject({ isShuffled: true, shuffleSeed: 2 ** 30 });
    });

    test("draws a new seed each time", () => {
      const { favoritesSearch } = setup();

      favoritesSearch.shuffle();
      favoritesSearch.shuffle();
      expect(favoritesSearch.settings.value.shuffleSeed).toBe(2 ** 31);
    });

    test("reorders the results", () => {
      const { favoritesSearch } = setup(createScoredPosts(...Array.from({ length: 20 }, (_, index) => index + 1)));
      const before = getResultPostIds(favoritesSearch);

      favoritesSearch.shuffle();
      expect(getResultPostIds(favoritesSearch)).not.toEqual(before);
      expect(getResultPostIds(favoritesSearch).toSorted()).toEqual(before.toSorted());
    });

    test("keeps the query", () => {
      const { favoritesSearch } = setup();

      favoritesSearch.submit("apple");
      favoritesSearch.shuffle();
      expect(favoritesSearch.settings.value.query).toBe("apple");
    });
  });

  describe("invert", () => {
    test("shows the favorites not matching the query", () => {
      const { favoritesSearch } = setup(createTaggedPosts("apple", "banana"));

      favoritesSearch.submit("apple");
      favoritesSearch.invert();
      expect(getResultPostIds(favoritesSearch)).toEqual(["2"]);
    });

    test("restores the results when inverted twice", () => {
      const { favoritesSearch } = setup(createTaggedPosts("apple", "banana"));

      favoritesSearch.submit("apple");
      favoritesSearch.invert();
      favoritesSearch.invert();
      expect(getResultPostIds(favoritesSearch)).toEqual(["1"]);
    });

    test("shows nothing while the query is empty", () => {
      const { favoritesSearch } = setup(createTaggedPosts("apple", "banana"));

      favoritesSearch.invert();
      expect(getResultPostIds(favoritesSearch)).toEqual([]);
    });

    test("keeps the inversion for a new query", () => {
      const { favoritesSearch } = setup(createTaggedPosts("apple", "banana"));

      favoritesSearch.invert();
      favoritesSearch.submit("apple");
      expect(getResultPostIds(favoritesSearch)).toEqual(["2"]);
    });

    test("keeps the blacklist outside the inversion", () => {
      const { favoritesSearch } = setup(
        createTaggedPosts("apple", "banana", "cherry"),
        { blacklistedTags: ["apple"], partialFavoritesSearchSettings: { isBlacklistEnabled: true } }
      );

      favoritesSearch.submit("banana");
      favoritesSearch.invert();
      expect(getResultPostIds(favoritesSearch)).toEqual(["3"]);
    });
  });

  describe("clearFilters", () => {
    test("shows every favorite the query matches again", () => {
      const { favoritesSearch } = setup([
        createPost({ id: "1", tags: "apple", rating: "safe" }),
        createPost({ id: "2", tags: "apple", rating: "explicit" }),
        createPost({ id: "3", tags: "banana", rating: "safe" })
      ]);

      favoritesSearch.submit("apple");
      favoritesSearch.updateSettings({ allowedRatings: toRatingMask("safe") });
      favoritesSearch.clearFilters();
      expect(getResultPostIds(favoritesSearch)).toEqual(["1", "2"]);
    });

    test("puts everything but the query back to its default", () => {
      const { favoritesSearch } = setup();

      favoritesSearch.submit("apple");
      favoritesSearch.updateSettings({ sortKey: "score", isSortAscending: true, allowedRatings: toRatingMask("safe"), isBlacklistEnabled: true });
      favoritesSearch.invert();
      favoritesSearch.shuffle();
      favoritesSearch.clearFilters();
      expect(favoritesSearch.settings.value).toEqual(buildFavoritesSearchSettings({ query: "apple", shuffleSeed: 0 }));
    });
  });

  describe("clearSearch", () => {
    test("shows every favorite again", () => {
      const { favoritesSearch } = setup([
        createPost({ id: "1", tags: "apple", rating: "safe" }),
        createPost({ id: "2", tags: "banana", rating: "explicit" })
      ], { blacklistedTags: ["apple"] });

      favoritesSearch.updateSettings({ allowedRatings: toRatingMask("safe"), isBlacklistEnabled: true });
      favoritesSearch.submit("banana");
      favoritesSearch.invert();
      favoritesSearch.clearSearch();
      expect(getResultPostIds(favoritesSearch)).toEqual(["1", "2"]);
    });

    test("puts every setting back to its default", () => {
      const { favoritesSearch } = setup();

      favoritesSearch.submit("apple");
      favoritesSearch.updateSettings({ sortKey: "score", isSortAscending: true });
      favoritesSearch.shuffle();
      favoritesSearch.clearSearch();
      expect(favoritesSearch.settings.value).toEqual(buildFavoritesSearchSettings({ shuffleSeed: 0 }));
    });
  });

  describe("searched", () => {
    test.each([
      { name: "submit", act: (favoritesSearch: FavoritesSearch): void => favoritesSearch.submit("a") },
      { name: "updateSettings", act: (favoritesSearch: FavoritesSearch): void => favoritesSearch.updateSettings({ sortKey: "score" }) },
      { name: "invert", act: (favoritesSearch: FavoritesSearch): void => favoritesSearch.invert() },
      { name: "shuffle", act: (favoritesSearch: FavoritesSearch): void => favoritesSearch.shuffle() },
      { name: "clearFilters", act: (favoritesSearch: FavoritesSearch): void => favoritesSearch.clearFilters() },
      { name: "clearSearch", act: (favoritesSearch: FavoritesSearch): void => favoritesSearch.clearSearch() }
    ])("fires once on $name", ({ act }) => {
      const { favoritesSearch } = setup();
      let count = 0;

      favoritesSearch.searched.on(() => {
        count += 1;
      });
      act(favoritesSearch);
      expect(count).toBe(1);
    });

    test("fires after the new results are in", () => {
      const { favoritesSearch } = setup(createTaggedPosts("apple", "banana"));
      const seen: string[][] = [];

      favoritesSearch.searched.on(() => seen.push(favoritesSearch.matchedFavorites.peek().map(favorite => favorite.id)));
      favoritesSearch.submit("apple");
      expect(seen).toEqual([["1"]]);
    });

    test("stays silent when favorites are indexed or the index is rebuilt", () => {
      const { favoritesSearch, favoritesCollection, favoritesSearchIndex } = setup(createTaggedPosts("apple"));
      let count = 0;

      favoritesSearch.searched.on(() => {
        count += 1;
      });
      favoritesSearchIndex.add(favoritesCollection.append([createPost({ id: "2" })]));
      favoritesSearchIndex.rebuild(favoritesCollection.getAll());
      expect(count).toBe(0);
    });
  });

  describe("when favorites are indexed", () => {
    test("keeps the searched results in place and appends the arrivals in arrival order", () => {
      const { favoritesSearch, favoritesCollection, favoritesSearchIndex } = setup(
        createScoredPosts(1, 3, 2),
        { partialFavoritesSearchSettings: { sortKey: "score" } }
      );

      favoritesSearchIndex.add(favoritesCollection.append(createScoredPosts(5, 4)));
      expect(getResultPostIds(favoritesSearch)).toEqual(["3", "2", "1", "5", "4"]);
    });

    test("appends only the arrivals matching the current search", () => {
      const { favoritesSearch, favoritesCollection, favoritesSearchIndex } = setup(createTaggedPosts("apple"));

      favoritesSearch.submit("banana");
      favoritesSearchIndex.add(favoritesCollection.append([createPost({ id: "2", tags: "apple" }), createPost({ id: "3", tags: "banana" })]));
      expect(getResultPostIds(favoritesSearch)).toEqual(["3"]);
    });

    test("leaves the results alone when no arrival matches", () => {
      const { favoritesSearch, favoritesCollection, favoritesSearchIndex } = setup(createTaggedPosts("apple"));

      favoritesSearch.submit("apple");
      const { shown, stop } = watchResults(favoritesSearch);

      favoritesSearchIndex.add(favoritesCollection.append([createPost({ id: "2", tags: "banana" })]));
      expect(shown).toEqual([["1"]]);
      stop();
    });

    test("stops appending once disposed", () => {
      const { favoritesSearch, favoritesCollection, favoritesSearchIndex } = setup();

      favoritesSearch.dispose();
      favoritesSearchIndex.add(favoritesCollection.append(createTaggedPosts("apple")));
      expect(getResultPostIds(favoritesSearch)).toEqual([]);
    });
  });

  describe("when the index is rebuilt", () => {
    test("searches again, new favorites first", () => {
      const { favoritesSearch, favoritesCollection, favoritesSearchIndex } = setup(createTaggedPosts("apple"));

      favoritesCollection.prependAsNew([createPost({ id: "2" })]);
      favoritesSearchIndex.rebuild(favoritesCollection.getAll());
      expect(favoritesSearch.matchedFavorites.value.map(favorite => [favorite.id, favorite.isNew])).toEqual([["2", true], ["1", false]]);
    });
  });

  describe("when a favorite is refreshed", () => {
    test("keeps it shown even when it no longer matches", () => {
      const { favoritesSearch, favoritesCollection, favoritesSearchIndex } = setup(createTaggedPosts("apple"));
      const [arenaFavorite] = favoritesCollection.getAll();

      favoritesSearch.submit("apple");
      favoritesCollection.overwrite(createPost({ id: "1", tags: "banana" }));
      favoritesSearchIndex.update([{ doc: arenaFavorite, oldTerms: new Set(["apple"]), newTerms: arenaFavorite.tags }]);
      expect(getResultPostIds(favoritesSearch)).toEqual(["1"]);
    });
  });
});
