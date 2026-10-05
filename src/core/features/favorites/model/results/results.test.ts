import { describe, expect, test } from "vitest";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { FavoritesCollection } from "@/core/features/favorites/model/collection/collection";
import { FavoritesResults } from "@/core/features/favorites/model/results/results";
import { ResultsState } from "@/core/features/favorites/types/results";
import { createPosts } from "@/testing/post";
import { effect } from "@/core/utils/reactive/signal";

function createFavorites(count: number): Favorite[] {
  return new FavoritesCollection().append(createPosts(...Array.from({ length: count }, (_, index) => String(index + 1))));
}

function recordStates(results: FavoritesResults): ResultsState[] {
  const states: ResultsState[] = [];

  effect(() => {
    states.push(results.state.value);
  });
  return states;
}

describe("FavoritesResults", () => {
  test("starts with no matches on page 1", () => {
    expect(new FavoritesResults().state.value).toEqual({ matches: [], pageNumber: 1 });
  });

  describe("replace", () => {
    test("shows the new matches from page 1 in one update", () => {
      const results = new FavoritesResults();
      const favorites = createFavorites(30);

      results.replace(favorites);
      results.setPage(3);
      const states = recordStates(results);

      results.replace(favorites.slice(0, 5));
      expect(states).toHaveLength(2);
      expect(states[1]).toEqual({ matches: favorites.slice(0, 5), pageNumber: 1 });
    });
  });

  describe("append", () => {
    test("adds matches after the existing ones and keeps the page", () => {
      const results = new FavoritesResults();
      const favorites = createFavorites(30);

      results.replace(favorites.slice(0, 20));
      results.setPage(2);
      results.append(favorites.slice(20));
      expect(results.state.value).toEqual({ matches: favorites, pageNumber: 2 });
    });
  });

  describe("setPage", () => {
    test("stores the page", () => {
      const results = new FavoritesResults();

      results.setPage(2);
      expect(results.state.value.pageNumber).toBe(2);
    });

    test("publishes nothing when the page is unchanged", () => {
      const results = new FavoritesResults();
      const states = recordStates(results);

      results.setPage(1);
      expect(states).toHaveLength(1);
    });
  });
});
