import { FavoritesConfiguration, FavoritesPreferences } from "@/core/features/favorites/types/favorites";
import { Post, Rating } from "@/core/domain/post/post";
import { describe, expect, test } from "vitest";
import { FavoritesModel } from "@/core/features/favorites/model/model";
import { FavoritesSearchFlow } from "@/core/features/favorites/flows/search";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { Preference } from "@/core/utils/reactive/preference";
import { Signal } from "@/core/utils/reactive/signal";
import { Sort } from "@/core/features/favorites/types/search";
import { createPost } from "@/testing/post";

const ALL_RATINGS: ReadonlySet<Rating> = new Set(["explicit", "questionable", "safe"]);
const NEWEST_FIRST: Sort = { key: "favorited", isAscending: false };

interface SearchSources {
  posts: Post[];
  configuration?: Partial<FavoritesConfiguration>;
  sort?: Sort;
  isBlacklistEnabled?: boolean;
  randomValues?: number[];
}

function createPreference<T>(initial: T): Preference<T> {
  const signal = new Signal(initial);
  return {
    get value(): T {
      return signal.value;
    },
    peek: (): T => signal.peek(),
    set: (value: T): void => {
      signal.value = value;
    }
  };
}

function setup({ posts, configuration = {}, sort = NEWEST_FIRST, isBlacklistEnabled = false, randomValues = [0.25, 0.75] }: SearchSources): {
  flow: FavoritesSearchFlow;
  model: FavoritesModel;
  preferences: FavoritesPreferences;
} {
  const model = new FavoritesModel();
  const preferences: FavoritesPreferences = {
    sort: createPreference(sort),
    allowedRatings: createPreference(ALL_RATINGS),
    isBlacklistEnabled: createPreference(isBlacklistEnabled),
    resultsPerPage: createPreference(50),
    isInfiniteScrollEnabled: createPreference(false)
  };
  const flow = new FavoritesSearchFlow(
    { userOwnsFavorites: true, blacklistedTags: "", ...configuration },
    { model, preferences, randomSource: new MemoryRandomSource(randomValues) }
  );

  model.append(posts);
  model.indexAll();
  return { flow, model, preferences };
}

function createTaggedPosts(...tags: string[]): Post[] {
  return tags.map((tag, index) => createPost({ id: String(index + 1), tags: tag }));
}

function getShownIds(model: FavoritesModel): string[] {
  return model.results.value.matches.map(favorite => favorite.id);
}

describe("FavoritesSearchFlow", () => {
  describe("search", () => {
    test("shows the favorites matching the query", () => {
      const { flow, model } = setup({ posts: createTaggedPosts("apple", "banana", "apple") });

      flow.search("apple");
      expect(getShownIds(model)).toEqual(["1", "3"]);
    });

    test("publishes the query", () => {
      const { flow } = setup({ posts: [] });

      flow.search("apple");
      expect(flow.query.value).toBe("apple");
    });

    test("sorts by the stored sort order", () => {
      const { flow, model } = setup({ posts: createTaggedPosts("apple", "apple"), sort: { key: "favorited", isAscending: true } });

      flow.search("apple");
      expect(getShownIds(model)).toEqual(["2", "1"]);
    });
  });

  describe("sortBy", () => {
    test("stores the sort order and searches the current query again", () => {
      const { flow, model, preferences } = setup({ posts: createTaggedPosts("apple", "banana", "apple") });
      const oldestFirst = { key: "favorited", isAscending: true } as const;

      flow.search("apple");
      flow.sortBy(oldestFirst);
      expect(preferences.sort.value).toEqual(oldestFirst);
      expect(getShownIds(model)).toEqual(["3", "1"]);
    });
  });

  describe("allowRatings", () => {
    test("stores the ratings and shows only favorites with them", () => {
      const posts = [createPost({ id: "1", rating: "safe" }), createPost({ id: "2", rating: "explicit" })];
      const { flow, model, preferences } = setup({ posts });
      const safeOnly: ReadonlySet<Rating> = new Set(["safe"]);

      flow.allowRatings(safeOnly);
      expect(preferences.allowedRatings.value).toBe(safeOnly);
      expect(getShownIds(model)).toEqual(["1"]);
    });
  });

  describe("setBlacklistEnabled", () => {
    test("hides blacklisted favorites on the user's own page only while enabled", () => {
      const { flow, model, preferences } = setup({ posts: createTaggedPosts("apple", "banana"), configuration: { blacklistedTags: "banana" } });

      flow.setBlacklistEnabled(true);
      expect(preferences.isBlacklistEnabled.value).toBe(true);
      expect(getShownIds(model)).toEqual(["1"]);

      flow.setBlacklistEnabled(false);
      expect(getShownIds(model)).toEqual(["1", "2"]);
    });

    test("always hides blacklisted favorites on someone else's page", () => {
      const { flow, model } = setup({ posts: createTaggedPosts("apple", "banana"), configuration: { userOwnsFavorites: false, blacklistedTags: "banana" } });

      flow.setBlacklistEnabled(false);
      expect(getShownIds(model)).toEqual(["1"]);
    });
  });

  describe("invert", () => {
    test("shows the favorites the current query leaves out", () => {
      const { flow, model } = setup({ posts: createTaggedPosts("apple", "banana", "apple") });

      flow.search("apple");
      flow.invert();
      expect(getShownIds(model)).toEqual(["2"]);
    });
  });

  describe("shuffle", () => {
    test("draws a new order each time", () => {
      const { flow, model } = setup({ posts: createTaggedPosts(...Array.from({ length: 20 }, () => "apple")) });

      flow.search("");
      flow.shuffle();
      const first = getShownIds(model);

      flow.shuffle();
      expect(getShownIds(model)).not.toEqual(first);
      expect(getShownIds(model).toSorted()).toEqual(first.toSorted());
    });

    test("keeps the shuffled order when a random sort searches again", () => {
      const posts = createTaggedPosts(...Array.from({ length: 20 }, () => "apple"));
      const { flow, model } = setup({ posts, sort: { key: "random", isAscending: false } });

      flow.search("");
      flow.shuffle();
      const shuffled = getShownIds(model);

      flow.search("");
      expect(getShownIds(model)).toEqual(shuffled);
    });
  });

  describe("getSearchCriteria", () => {
    test("combines the query, the stored preferences, and the shuffle seed", () => {
      const { flow } = setup({ posts: [], randomValues: [0.5] });

      flow.search("apple");
      expect(flow.getSearchCriteria()).toEqual({
        query: "apple",
        sort: NEWEST_FIRST,
        allowedRatings: ALL_RATINGS,
        blacklistQuery: "",
        shuffleSeed: 2 ** 31
      });
    });
  });
});
