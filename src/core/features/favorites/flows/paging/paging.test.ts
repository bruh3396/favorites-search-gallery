import { describe, expect, test } from "vitest";
import { FavoritesModel } from "@/core/features/favorites/model/model";
import { FavoritesPagingFlow } from "@/core/features/favorites/flows/paging/paging";
import { FavoritesPreferences } from "@/core/features/favorites/types/favorites";
import { Post } from "@/core/domain/post/post";
import { Preference } from "@/core/utils/reactive/preference";
import { Signal } from "@/core/utils/reactive/signal";
import { Sort } from "@/core/features/favorites/types/search";
import { createPost } from "@/testing/post";
import { createSearchCriteria } from "@/core/features/favorites/testing/criteria";

interface PagingSources {
  count: number;
  resultsPerPage?: number;
  infiniteScroll?: boolean;
  canWrap?: boolean;
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

function createPosts(count: number, firstId = 1): Post[] {
  return Array.from({ length: count }, (_, index) => createPost({ id: String(firstId + index) }));
}

function setup({ count, resultsPerPage = 2, infiniteScroll = false, canWrap = true }: PagingSources): {
  flow: FavoritesPagingFlow;
  model: FavoritesModel;
  resultsPerPage: Preference<number>;
} {
  const model = new FavoritesModel();
  const preferences: FavoritesPreferences = {
    sort: createPreference<Sort>({ key: "favorited", isAscending: false }),
    allowedRatings: createPreference(createSearchCriteria().allowedRatings),
    isBlacklistEnabled: createPreference(false),
    resultsPerPage: createPreference(resultsPerPage),
    isInfiniteScrollEnabled: createPreference(infiniteScroll)
  };
  const flow = new FavoritesPagingFlow({ model, preferences, canWrap: (): boolean => canWrap });

  model.append(createPosts(count));
  model.indexAll();
  model.search(createSearchCriteria());
  return { flow, model, resultsPerPage: preferences.resultsPerPage };
}

function getShownIds(flow: FavoritesPagingFlow): string[] {
  return flow.posts.value.map(favorite => favorite.id);
}

describe("FavoritesPagingFlow", () => {
  describe("shown", () => {
    test("shows the first page of results", () => {
      const { flow } = setup({ count: 5 });

      expect(getShownIds(flow)).toEqual(["1", "2"]);
    });

    test("follows the page shown", () => {
      const { flow } = setup({ count: 5 });

      flow.showPage(3);
      expect(getShownIds(flow)).toEqual(["5"]);
    });

    test("starts over at the first page after a new search", () => {
      const { flow, model } = setup({ count: 5 });

      flow.showPage(2);
      model.search(createSearchCriteria());
      expect(getShownIds(flow)).toEqual(["1", "2"]);
    });

    test("follows a change to the results per page", () => {
      const { flow, resultsPerPage } = setup({ count: 5 });

      resultsPerPage.set(3);
      expect(getShownIds(flow)).toEqual(["1", "2", "3"]);
    });

    test("shows the last page when the page shown no longer exists", () => {
      const { flow, resultsPerPage } = setup({ count: 5 });

      flow.showPage(3);
      resultsPerPage.set(4);
      expect(getShownIds(flow)).toEqual(["5"]);
    });

    test("reveals the first batch in infinite scroll", () => {
      const { flow } = setup({ count: 30, infiniteScroll: true });

      expect(flow.posts.value).toHaveLength(25);
    });

    test("keeps the revealed batches when matches are appended in infinite scroll", () => {
      const { flow, model } = setup({ count: 60, infiniteScroll: true });

      flow.advance("forward");
      model.appendMatches(model.append(createPosts(10, 61)), createSearchCriteria());
      expect(flow.posts.value).toHaveLength(50);
    });
  });

  describe("showPage", () => {
    test.each([
      [0, 1],
      [9, 3]
    ])("stores page %i as page %i", (pageNumber, expected) => {
      const { flow, model } = setup({ count: 5 });

      flow.showPage(pageNumber);
      expect(model.results.value.pageNumber).toBe(expected);
    });

    test("counts batches of 25 in infinite scroll", () => {
      const { flow, model } = setup({ count: 60, infiniteScroll: true });

      flow.showPage(9);
      expect(model.results.value.pageNumber).toBe(3);
    });
  });

  describe("page", () => {
    test("publishes the current page and the page count", () => {
      const { flow } = setup({ count: 5 });

      flow.showPage(2);
      expect(flow.page.value).toMatchObject({ pageNumber: 2, pageCount: 3 });
    });
  });

  describe("setInfiniteScrollEnabled", () => {
    test("stores the choice and starts over from the top", () => {
      const { flow } = setup({ count: 60, resultsPerPage: 10 });

      flow.showPage(3);
      flow.setInfiniteScrollEnabled(true);
      expect(flow.posts.value).toHaveLength(25);
      flow.setInfiniteScrollEnabled(false);
      expect(getShownIds(flow)).toEqual(Array.from({ length: 10 }, (_, index) => String(index + 1)));
    });
  });

  describe("advance", () => {
    test("steps to the adjacent page", () => {
      const { flow } = setup({ count: 5 });

      expect(flow.advance("forward")).toBe(true);
      expect(getShownIds(flow)).toEqual(["3", "4"]);
    });

    test("wraps past either end once loaded", () => {
      const { flow } = setup({ count: 5 });

      expect(flow.advance("backward")).toBe(true);
      expect(getShownIds(flow)).toEqual(["5"]);
      expect(flow.advance("forward")).toBe(true);
      expect(getShownIds(flow)).toEqual(["1", "2"]);
    });

    test("wraps onto the same page when there is only one", () => {
      const { flow } = setup({ count: 2 });

      expect(flow.advance("forward")).toBe(true);
      expect(getShownIds(flow)).toEqual(["1", "2"]);
    });

    test("stops at either end while loading", () => {
      const { flow } = setup({ count: 3, canWrap: false });

      expect(flow.advance("backward")).toBe(false);
      expect(flow.advance("forward")).toBe(true);
      expect(flow.advance("forward")).toBe(false);
      expect(getShownIds(flow)).toEqual(["3"]);
    });

    test("reveals the next batch in infinite scroll", () => {
      const { flow } = setup({ count: 30, infiniteScroll: true });

      expect(flow.advance("forward")).toBe(true);
      expect(flow.posts.value).toHaveLength(30);
      expect(flow.advance("forward")).toBe(false);
    });

    test("never moves backward in infinite scroll", () => {
      const { flow } = setup({ count: 60, infiniteScroll: true });

      flow.advance("forward");
      expect(flow.advance("backward")).toBe(false);
      expect(flow.posts.value).toHaveLength(50);
    });
  });
});
