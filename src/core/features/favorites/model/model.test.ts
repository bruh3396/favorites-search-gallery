import { Post, getRatingBit } from "@/core/domain/post/post";
import { Signal, effect } from "@/core/utils/reactive/signal";
import { afterEach, describe, expect, test, vi } from "vitest";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { FavoritesModel } from "@/core/features/favorites/model/model";
import { FavoritesSearcher } from "@/core/features/favorites/model/search/searcher";
import { PaginationSettings } from "@/core/features/favorites/types/pagination";
import { SearchRequest } from "@/core/features/favorites/types/search";
import { createPost } from "@/testing/post";
import { createSearchRequest } from "@/core/features/favorites/testing/request";

interface Setup {
  model: FavoritesModel;
  search: (request: SearchRequest) => void;
  paginationSettings: Signal<PaginationSettings>;
}

interface Watch {
  shown: string[][];
  stop: () => void;
}

const ALL_ON_ONE_PAGE: PaginationSettings = { size: 1_000, infiniteScroll: false };
const EVERYTHING = createSearchRequest();
const SCORE_DESCENDING = createSearchRequest({ sortKey: "score", isSortAscending: false });

function setup(posts: Post[] = [], initialRequest: SearchRequest = EVERYTHING, settings = ALL_ON_ONE_PAGE): Setup {
  const request = new Signal(initialRequest);
  const paginationSettings = new Signal(settings);
  const model = new FavoritesModel({ favoritedByDefault: true }, { request, paginationSettings });

  const search = (next: SearchRequest): void => {
    request.value = next;
    model.search();
  };

  model.add(model.append(posts));
  return { model, search, paginationSettings };
}

function createPosts(count: number): Post[] {
  return Array.from({ length: count }, (_, index) => createPost({ id: String(index + 1) }));
}

function getPageResultIds(model: FavoritesModel): string[] {
  return getIds(model.paginationResult.value.favorites);
}

function getIds(favorites: readonly Favorite[]): string[] {
  return favorites.map(favorite => favorite.id);
}

function getResultIds(model: FavoritesModel): string[] {
  return getIds(model.searchResults.value);
}

function createScoredPosts(...scores: number[]): Post[] {
  return scores.map(score => createPost({ id: String(score), score }));
}

function createTaggedPosts(...tags: string[]): Post[] {
  return tags.map((tag, index) => createPost({ id: String(index + 1), tags: tag }));
}

function watchResults(model: FavoritesModel): Watch {
  const shown: string[][] = [];
  const stop = effect(() => {
    shown.push(getResultIds(model));
  });
  return { shown, stop };
}

function spyOnSearcher(): { search: ReturnType<typeof vi.spyOn>; match: ReturnType<typeof vi.spyOn> } {
  return {
    search: vi.spyOn(FavoritesSearcher.prototype, "search"),
    match: vi.spyOn(FavoritesSearcher.prototype, "match")
  };
}

describe("FavoritesModel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("returns nothing before favorites arrive", () => {
    expect(getResultIds(setup().model)).toEqual([]);
  });

  test("appends arrivals in arrival order", () => {
    const { model } = setup(createScoredPosts(1, 3, 2), SCORE_DESCENDING);

    expect(getResultIds(model)).toEqual(["1", "3", "2"]);
  });

  test("returns only the arrivals matching the request", () => {
    const { model } = setup(createTaggedPosts("apple", "banana", "apple"), createSearchRequest({ query: "apple" }));

    expect(getResultIds(model)).toEqual(["1", "3"]);
  });

  test("matches a metric comparison term", () => {
    const { model } = setup(createScoredPosts(1, 2, 3), createSearchRequest({ query: "score:>1" }));

    expect(getResultIds(model)).toEqual(["2", "3"]);
  });

  test("filters by the ratings it reads from the collection", () => {
    const posts = [createPost({ id: "1", rating: "safe" }), createPost({ id: "2", rating: "explicit" })];
    const { model } = setup(posts, createSearchRequest({ allowedRatings: getRatingBit("explicit") }));

    expect(getResultIds(model)).toEqual(["2"]);
  });

  test("returns nothing for appended favorites until they are added", () => {
    const { model } = setup();

    model.append(createTaggedPosts("apple"));
    expect(getResultIds(model)).toEqual([]);
  });

  describe("search", () => {
    test("orders every indexed favorite", () => {
      const { model, search } = setup(createScoredPosts(1, 3, 2));

      search(SCORE_DESCENDING);
      expect(getResultIds(model)).toEqual(["3", "2", "1"]);
    });

    test("replaces the results of the previous search", () => {
      const { model, search } = setup(createTaggedPosts("apple", "banana"));

      search(createSearchRequest({ query: "apple" }));
      model.add(model.append([createPost({ id: "3", tags: "apple" }), createPost({ id: "4", tags: "banana" })]));
      search(createSearchRequest({ query: "banana" }));
      expect(getResultIds(model)).toEqual(["2", "4"]);
    });

    test("shows a rebuilt collection, prepended favorites first", () => {
      const { model, search } = setup();

      model.append(createTaggedPosts("apple", "banana"));
      model.prependAsNew([createPost({ id: "3" })]);
      model.rebuild();
      search(EVERYTHING);
      expect(getResultIds(model)).toEqual(["3", "1", "2"]);
    });

    test("puts new favorites first, marked as new", () => {
      const { model, search } = setup(createTaggedPosts("apple"));

      model.prependAsNew([createPost({ id: "2" })]);
      model.rebuild();
      search(EVERYTHING);
      expect(model.searchResults.value.map(favorite => [favorite.id, favorite.isNew])).toEqual([["2", true], ["1", false]]);
    });

    test("matches a favorite by its refreshed tags once the index is updated", () => {
      const { model, search } = setup(createTaggedPosts("apple"));
      const refreshed = model.overwrite(createPost({ id: "1", tags: "banana" }));

      model.update(refreshed === undefined ? [] : [refreshed]);
      search(createSearchRequest({ query: "banana" }));
      expect(getResultIds(model)).toEqual(["1"]);
    });

    test("keeps favorites searchable after compacting", () => {
      const { model, search } = setup(createTaggedPosts("apple", "banana"));

      model.compact();
      search(createSearchRequest({ query: "banana" }));
      expect(getResultIds(model)).toEqual(["2"]);
    });

    test("searches once and reruns the results once", () => {
      const { model, search } = setup(createTaggedPosts("apple", "banana"));
      const { shown, stop } = watchResults(model);
      const searcher = spyOnSearcher();

      search(createSearchRequest({ query: "apple" }));
      expect({ search: searcher.search.mock.calls.length, runs: shown.length }).toEqual({ search: 1, runs: 2 });
      expect(shown.at(-1)).toEqual(["1"]);
      stop();
    });
  });

  describe("add", () => {
    test("keeps the searched results in place and appends later arrivals in arrival order", () => {
      const { model, search } = setup(createScoredPosts(1, 3, 2));

      search(SCORE_DESCENDING);
      model.add(model.append(createScoredPosts(5, 4)));
      expect(getResultIds(model)).toEqual(["3", "2", "1", "5", "4"]);
    });

    test("matches the arrivals against the current request", () => {
      const { model, search } = setup(createTaggedPosts("apple"));

      search(createSearchRequest({ query: "banana" }));
      model.add(model.append([createPost({ id: "2", tags: "apple" }), createPost({ id: "3", tags: "banana" })]));
      expect(getResultIds(model)).toEqual(["3"]);
    });

    test("matches only the arrivals", () => {
      const { model } = setup(createScoredPosts(1, 3, 2));
      const { shown, stop } = watchResults(model);
      const { search, match } = spyOnSearcher();

      model.add(model.append(createScoredPosts(5, 4)));
      expect(match.mock.calls.map(([, candidates]: unknown[]) => getIds(candidates as Favorite[]))).toEqual([["5", "4"]]);
      expect({ search: search.mock.calls.length, runs: shown.length }).toEqual({ search: 0, runs: 2 });
      stop();
    });

    test("keeps the same results when no arrival matches", () => {
      const { model } = setup(createTaggedPosts("apple"), createSearchRequest({ query: "apple" }));
      const { shown, stop } = watchResults(model);

      model.add(model.append([createPost({ id: "2", tags: "banana" })]));
      expect(shown).toEqual([["1"], ["1"]]);
      stop();
    });
  });

  test("leaves the results alone when the index is rebuilt", () => {
    const { model } = setup(createTaggedPosts("apple"));
    const { shown, stop } = watchResults(model);

    model.prependAsNew([createPost({ id: "2" })]);
    model.rebuild();
    expect(shown).toEqual([["1"]]);
    stop();
  });

  test("keeps a refreshed favorite shown when it no longer matches", () => {
    const { model } = setup(createTaggedPosts("apple"), createSearchRequest({ query: "apple" }));
    const { shown, stop } = watchResults(model);
    const { search, match } = spyOnSearcher();
    const refreshed = model.overwrite(createPost({ id: "1", tags: "banana" }));

    model.update(refreshed === undefined ? [] : [refreshed]);
    expect({ search: search.mock.calls.length, match: match.mock.calls.length, shown }).toEqual({ search: 0, match: 0, shown: [["1"]] });
    stop();
  });

  test("announces a refreshed favorite that gained media", () => {
    const { model } = setup(createTaggedPosts("apple"));
    const hydrated: string[] = [];

    model.hydrated.on(favorite => hydrated.push(favorite.id));
    model.overwrite(createPost({ id: "1", media: { kind: "image", locator: "1/a.jpg" } }));
    expect(hydrated).toEqual(["1"]);
  });

  test("lists the ids of every favorite", () => {
    const { model } = setup(createTaggedPosts("apple", "banana"));

    expect(model.getAllIds()).toEqual(new Set(["1", "2"]));
  });

  describe("paginationResult", () => {
    test("shows the first page of the results", () => {
      const { model } = setup(createPosts(5), EVERYTHING, { size: 2, infiniteScroll: false });

      expect(getPageResultIds(model)).toEqual(["1", "2"]);
      expect(model.paginationResult.value).toMatchObject({ pageNumber: 1, totalPages: 3, totalResults: 5 });
    });

    test("shows the results up to the page while scrolling infinitely", () => {
      const { model } = setup(createPosts(60), EVERYTHING, { size: 2, infiniteScroll: true });

      model.goToPage(2);
      expect(model.paginationResult.value.favorites).toHaveLength(50);
    });

    test("shows the page of the current settings", () => {
      const { model, paginationSettings } = setup(createPosts(5), EVERYTHING, { size: 2, infiniteScroll: false });

      paginationSettings.value = { size: 3, infiniteScroll: false };
      expect(getPageResultIds(model)).toEqual(["1", "2", "3"]);
    });
  });

  describe("goToPage", () => {
    test("shows the given page", () => {
      const { model } = setup(createPosts(5), EVERYTHING, { size: 2, infiniteScroll: false });

      model.goToPage(3);
      expect(getPageResultIds(model)).toEqual(["5"]);
    });

    test("stays on the page when more favorites arrive", () => {
      const { model } = setup(createPosts(3), EVERYTHING, { size: 2, infiniteScroll: false });

      model.goToPage(2);
      model.add(model.append([createPost({ id: "4" }), createPost({ id: "5" })]));
      expect(getPageResultIds(model)).toEqual(["3", "4"]);
    });

    test("goes no further than the last page, even after more favorites arrive", () => {
      const { model } = setup(createPosts(3), EVERYTHING, { size: 2, infiniteScroll: false });

      model.goToPage(5);
      model.add(model.append(createPosts(8).slice(3)));
      expect(model.paginationResult.value.pageNumber).toBe(2);
    });
  });

  describe("isFavorited", () => {
    test.each([true, false])("returns the default %s for an untouched favorite", favoritedByDefault => {
      const model = new FavoritesModel({ favoritedByDefault }, { request: new Signal(EVERYTHING), paginationSettings: new Signal(ALL_ON_ONE_PAGE) });

      expect(model.isFavorited("1")).toBe(favoritedByDefault);
    });

    test("returns the latest recorded addition or removal", () => {
      const { model } = setup();

      model.recordRemoval("1");
      expect(model.isFavorited("1")).toBe(false);
      model.recordAddition("1");
      expect(model.isFavorited("1")).toBe(true);
    });

    test("reruns an effect that reads it when the favorite is recorded", () => {
      const { model } = setup();
      const seen: boolean[] = [];
      const stop = effect(() => {
        seen.push(model.isFavorited("1"));
      });

      model.recordRemoval("1");
      expect(seen).toEqual([true, false]);
      stop();
    });
  });
});
