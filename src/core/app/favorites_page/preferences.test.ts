import { createPaginationSettings, createSearchSettings } from "@/core/app/favorites_page/preferences";
import { describe, expect, test } from "vitest";
import { ALL_RATINGS_MASK } from "@/core/domain/post/post";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";

describe("createSearchSettings", () => {
  test("starts from the defaults when nothing is stored", () => {
    expect(createSearchSettings(new MemoryLocalKeyedValues()).value).toEqual({
      sortKey: "favorited",
      isSortAscending: false,
      allowedRatings: ALL_RATINGS_MASK,
      isBlacklistEnabled: false
    });
  });

  test("restores the stored settings", () => {
    const store = new MemoryLocalKeyedValues();

    createSearchSettings(store).set({ sortKey: "random", isSortAscending: true, allowedRatings: 4, isBlacklistEnabled: true });
    expect(createSearchSettings(store).value).toEqual({ sortKey: "random", isSortAscending: true, allowedRatings: 4, isBlacklistEnabled: true });
  });

  test("falls back to the default for each stored setting that isn't valid", () => {
    const store = new MemoryLocalKeyedValues();

    store.set("favoritesSearch", { sortKey: "unknown", isSortAscending: true, allowedRatings: ALL_RATINGS_MASK + 1 });
    expect(createSearchSettings(store).value).toMatchObject({ sortKey: "favorited", isSortAscending: true, allowedRatings: ALL_RATINGS_MASK });
  });
});

describe("createPaginationSettings", () => {
  test("starts with 50 results per page when nothing is stored", () => {
    expect(createPaginationSettings(new MemoryLocalKeyedValues()).value).toEqual({ size: 50, infiniteScroll: false });
  });

  test("restores the stored settings", () => {
    const store = new MemoryLocalKeyedValues();

    createPaginationSettings(store).set({ size: 100, infiniteScroll: true });
    expect(createPaginationSettings(store).value).toEqual({ size: 100, infiniteScroll: true });
  });

  test.each([0, 1.5, "100"])("falls back to the default size for a stored size of %o", size => {
    const store = new MemoryLocalKeyedValues();

    store.set("favoritesPagination", { size, infiniteScroll: true });
    expect(createPaginationSettings(store).value).toEqual({ size: 50, infiniteScroll: true });
  });
});
