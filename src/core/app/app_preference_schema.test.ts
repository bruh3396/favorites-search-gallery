import { describe, expect, test } from "vitest";
import { APP_PREFERENCE_SCHEMA, AppPreferences } from "@/core/app/app_preference_schema";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { createPreferenceTree } from "@/core/utils/preference/preference_tree";

function createFavorites(storage = new MemoryLocalKeyedValues()): AppPreferences["favorites"] {
  return createPreferenceTree(APP_PREFERENCE_SCHEMA, storage, ["favorites"]).favorites;
}

describe("APP_PREFERENCE_SCHEMA", () => {
  test("restores a stored favorites layout and falls back to the default for one it doesn't recognize", () => {
    const storage = new MemoryLocalKeyedValues();
    const defaultLayout = createFavorites().grid.layout.value;

    storage.set("favorites", { grid: { layout: "row" } });
    expect(createFavorites(storage).grid.layout.value).toBe("row");
    storage.set("favorites", { grid: { layout: "masonry" } });
    expect(createFavorites(storage).grid.layout.value).toBe(defaultLayout);
  });

  test("restores the favorites page size and infinite scroll it stores", () => {
    const storage = new MemoryLocalKeyedValues();
    const preferences = createFavorites(storage);

    preferences.pageSize.set(100);
    preferences.infiniteScroll.set(true);
    const restored = createFavorites(storage);

    expect([restored.pageSize.value, restored.infiniteScroll.value]).toEqual([100, true]);
  });

  test("falls back to the default page size for one below 1", () => {
    const storage = new MemoryLocalKeyedValues();

    storage.set("favorites", { pageSize: 0 });
    expect(createFavorites(storage).pageSize.value).toBe(createFavorites().pageSize.value);
  });

  test("shows the tab strip by default and restores it hidden once stored", () => {
    const storage = new MemoryLocalKeyedValues();

    expect(createFavorites(storage).tabStripVisible.value).toBe(true);
    createFavorites(storage).tabStripVisible.set(false);
    expect(createFavorites(storage).tabStripVisible.value).toBe(false);
  });

  test("keeps the post list's grid and lightbox apart from the favorites'", () => {
    const storage = new MemoryLocalKeyedValues();
    const { favorites, postList } = createPreferenceTree(APP_PREFERENCE_SCHEMA, storage, ["favorites", "postList"]);

    postList.grid.columnCount.set(3);
    postList.lightbox.muted.set(true);
    expect([favorites.grid.columnCount.value, favorites.lightbox.muted.value]).toEqual([6, false]);
  });

  test("falls back to the default lightbox volume for one outside 0 to 1", () => {
    const storage = new MemoryLocalKeyedValues();

    storage.set("favorites", { lightbox: { volume: 2 } });
    expect(createFavorites(storage).lightbox.volume.value).toBe(1);
  });

  test("keeps the details panel closed until it is opened", () => {
    const storage = new MemoryLocalKeyedValues();

    expect(createFavorites(storage).lightbox.details.open.value).toBe(false);
    createFavorites(storage).lightbox.details.open.set(true);
    expect(createFavorites(storage).lightbox.details.open.value).toBe(true);
  });

  test("shows details tags by category, left aligned, at medium size by default", () => {
    const { organization, alignment, size } = createFavorites().lightbox.details;

    expect([organization.value, alignment.value, size.value]).toEqual(["category", "start", "medium"]);
  });

  test("falls back to the default details size for an unknown one", () => {
    const storage = new MemoryLocalKeyedValues();

    storage.set("favorites", { lightbox: { details: { size: "huge" } } });
    expect(createFavorites(storage).lightbox.details.size.value).toBe("medium");
  });
});
