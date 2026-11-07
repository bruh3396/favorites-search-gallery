import { describe, expect, test } from "vitest";
import { APP_STORAGE_SCHEMA } from "@/core/app/app_storage_schema";
import { AppPreferences } from "@/core/app/app_preferences";
import { AppState } from "@/core/app/app_state";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { createStoredTree } from "@/core/utils/storage/stored_tree";

function createFavorites(localKeyedValues = new MemoryLocalKeyedValues()): AppPreferences["favorites"] {
  return createStoredTree(APP_STORAGE_SCHEMA.preferences, localKeyedValues, ["favorites"]).favorites;
}

describe("APP_STORAGE_SCHEMA", () => {
  test("restores a stored favorites layout and falls back to the default for one it doesn't recognize", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const defaultLayout = createFavorites().grid.layout.value;

    localKeyedValues.set("favorites", { grid: { layout: "row" } });
    expect(createFavorites(localKeyedValues).grid.layout.value).toBe("row");
    localKeyedValues.set("favorites", { grid: { layout: "masonry" } });
    expect(createFavorites(localKeyedValues).grid.layout.value).toBe(defaultLayout);
  });

  test("restores the favorites page size and infinite scroll it stores", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const { pagination } = createFavorites(localKeyedValues);

    pagination.pageSize.set(100);
    pagination.infiniteScroll.set(true);
    const restored = createFavorites(localKeyedValues).pagination;

    expect([restored.pageSize.value, restored.infiniteScroll.value]).toEqual([100, true]);
  });

  test("falls back to the default page size for one below 1", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("favorites", { pagination: { pageSize: 0 } });
    expect(createFavorites(localKeyedValues).pagination.pageSize.value).toBe(createFavorites().pagination.pageSize.value);
  });

  test("keeps the post list's grid and lightbox apart from the favorites'", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const { favorites, postList } = createStoredTree(APP_STORAGE_SCHEMA.preferences, localKeyedValues, ["favorites", "postList"]);

    postList.grid.columnCount.set(3);
    postList.lightbox.muted.set(true);
    expect([favorites.grid.columnCount.value, favorites.lightbox.muted.value]).toEqual([6, false]);
  });

  test("falls back to the default lightbox volume for one outside 0 to 1", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("favorites", { lightbox: { volume: 2 } });
    expect(createFavorites(localKeyedValues).lightbox.volume.value).toBe(1);
  });

  test("keeps the details panel closed until it is opened", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    expect(createFavorites(localKeyedValues).lightbox.details.isOpen.value).toBe(false);
    createFavorites(localKeyedValues).lightbox.details.isOpen.set(true);
    expect(createFavorites(localKeyedValues).lightbox.details.isOpen.value).toBe(true);
  });

  test("shows details tags by category, left aligned, at medium size by default", () => {
    const favoritesLightboxDetailsPreferences = createFavorites().lightbox.details;

    expect([
      favoritesLightboxDetailsPreferences.organization.value,
      favoritesLightboxDetailsPreferences.alignment.value,
      favoritesLightboxDetailsPreferences.size.value
    ]).toEqual(["category", "start", "medium"]);
  });

  test("falls back to the default details size for an unknown one", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("favorites", { lightbox: { details: { size: "huge" } } });
    expect(createFavorites(localKeyedValues).lightbox.details.size.value).toBe("medium");
  });

  describe("state", () => {
    function createFavoritesState(localKeyedValues = new MemoryLocalKeyedValues()): AppState["favorites"] {
      return createStoredTree(APP_STORAGE_SCHEMA.state, localKeyedValues, ["favorites"]).favorites;
    }

    test("keeps each owner's state apart", () => {
      const localKeyedValues = new MemoryLocalKeyedValues();
      const sizes = [{ width: 3, height: 2 }];

      createFavoritesState(localKeyedValues).get("1").sizes.set(sizes);
      expect([
        createFavoritesState(localKeyedValues).get("1").sizes.value,
        createFavoritesState(localKeyedValues).get("2").sizes.value.length
      ]).toEqual([sizes, 24]);
    });

    test("falls back to placeholder sizes for a stored list it doesn't recognize", () => {
      const localKeyedValues = new MemoryLocalKeyedValues();

      localKeyedValues.set("favorites", { 1: { sizes: [{ width: "wide" }] } });
      expect(createFavoritesState(localKeyedValues).get("1").sizes.value).toEqual(Array.from({ length: 24 }, () => ({ width: 1, height: 1 })));
    });

    function createFavoritesSearchHistory(localKeyedValues: MemoryLocalKeyedValues): AppState["favoritesSearchHistory"] {
      return createStoredTree(APP_STORAGE_SCHEMA.state, localKeyedValues, ["favoritesSearchHistory"]).favoritesSearchHistory;
    }

    test("starts with no search history and restores the one it stores", () => {
      const localKeyedValues = new MemoryLocalKeyedValues();

      expect(createFavoritesSearchHistory(localKeyedValues).value).toEqual([]);
      createFavoritesSearchHistory(localKeyedValues).set(["cat", "dog"]);
      expect(createFavoritesSearchHistory(localKeyedValues).value).toEqual(["cat", "dog"]);
    });

    test("falls back to no search history for a stored list it doesn't recognize", () => {
      const localKeyedValues = new MemoryLocalKeyedValues();

      localKeyedValues.set("favoritesSearchHistory", ["cat", 2]);
      expect(createFavoritesSearchHistory(localKeyedValues).value).toEqual([]);
    });

    function createFavoritesTabStripVisible(localKeyedValues: MemoryLocalKeyedValues): AppState["favoritesTabStripVisible"] {
      return createStoredTree(APP_STORAGE_SCHEMA.state, localKeyedValues, ["favoritesTabStripVisible"]).favoritesTabStripVisible;
    }

    test("shows the tab strip by default and restores it hidden once stored", () => {
      const localKeyedValues = new MemoryLocalKeyedValues();

      expect(createFavoritesTabStripVisible(localKeyedValues).value).toBe(true);
      createFavoritesTabStripVisible(localKeyedValues).set(false);
      expect(createFavoritesTabStripVisible(localKeyedValues).value).toBe(false);
    });

    function createFavoritesSearchSettingsVisible(localKeyedValues: MemoryLocalKeyedValues): AppState["favoritesSearchSettingsVisible"] {
      return createStoredTree(APP_STORAGE_SCHEMA.state, localKeyedValues, ["favoritesSearchSettingsVisible"]).favoritesSearchSettingsVisible;
    }

    test("hides the search settings by default and restores them shown once stored", () => {
      const localKeyedValues = new MemoryLocalKeyedValues();

      expect(createFavoritesSearchSettingsVisible(localKeyedValues).value).toBe(false);
      createFavoritesSearchSettingsVisible(localKeyedValues).set(true);
      expect(createFavoritesSearchSettingsVisible(localKeyedValues).value).toBe(true);
    });
  });
});
