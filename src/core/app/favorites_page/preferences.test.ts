import { describe, expect, test } from "vitest";
import { ALL_RATINGS_MASK } from "@/core/domain/post/post";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { createSearchSettings } from "@/core/app/favorites_page/preferences";

const STORED_SEARCH = {
  query: "apple",
  isInverted: true,
  sortKey: "random",
  isSortAscending: true,
  allowedRatings: 4,
  isBlacklistEnabled: true,
  isShuffled: true,
  shuffleSeed: 7
} as const;

describe("createSearchSettings", () => {
  test("starts from the defaults when nothing is stored", () => {
    expect(createSearchSettings(new MemoryLocalKeyedValues()).value).toEqual({
      query: "",
      isInverted: false,
      sortKey: "favorited",
      isSortAscending: false,
      allowedRatings: ALL_RATINGS_MASK,
      isBlacklistEnabled: false,
      isShuffled: false,
      shuffleSeed: 0
    });
  });

  test("restores the stored settings", () => {
    const store = new MemoryLocalKeyedValues();

    createSearchSettings(store).set(STORED_SEARCH);
    expect(createSearchSettings(store).value).toEqual(STORED_SEARCH);
  });

  test("falls back to the default for each stored setting that isn't valid", () => {
    const store = new MemoryLocalKeyedValues();

    store.set("favoritesSearch", { query: 3, sortKey: "unknown", isSortAscending: true, allowedRatings: ALL_RATINGS_MASK + 1, shuffleSeed: -1.5 });
    expect(createSearchSettings(store).value).toMatchObject({
      query: "", sortKey: "favorited", isSortAscending: true, allowedRatings: ALL_RATINGS_MASK, shuffleSeed: 0
    });
  });
});
