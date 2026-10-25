import { createFavoritesPreferences, createLightboxPreferences, createPostListPreferences } from "@/core/app/preferences";
import { describe, expect, test } from "vitest";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";

describe("createFavoritesPreferences", () => {
  test("restores a stored layout and falls back to the default for one it doesn't recognize", () => {
    const storage = new MemoryLocalKeyedValues();
    const defaultLayout = createFavoritesPreferences(new MemoryLocalKeyedValues()).layout.value;

    storage.set("layout", "row");
    expect(createFavoritesPreferences(storage).layout.value).toBe("row");
    storage.set("layout", "masonry");
    expect(createFavoritesPreferences(storage).layout.value).toBe(defaultLayout);
  });

  test("restores the page size and infinite scroll it stores", () => {
    const storage = new MemoryLocalKeyedValues();
    const preferences = createFavoritesPreferences(storage);

    preferences.pageSize.set(100);
    preferences.infiniteScroll.set(true);
    const restored = createFavoritesPreferences(storage);

    expect([restored.pageSize.value, restored.infiniteScroll.value]).toEqual([100, true]);
  });

  test("falls back to the default page size for one below 1", () => {
    const storage = new MemoryLocalKeyedValues();

    storage.set("pageSize", 0);
    expect(createFavoritesPreferences(storage).pageSize.value).toBe(createFavoritesPreferences(new MemoryLocalKeyedValues()).pageSize.value);
  });

  test("shows the tab strip by default and restores it hidden once stored", () => {
    const storage = new MemoryLocalKeyedValues();

    expect(createFavoritesPreferences(storage).tabStripVisible.value).toBe(true);
    createFavoritesPreferences(storage).tabStripVisible.set(false);
    expect(createFavoritesPreferences(storage).tabStripVisible.value).toBe(false);
  });
});

describe("createPostListPreferences", () => {
  test("restores the grid preferences it stores", () => {
    const storage = new MemoryLocalKeyedValues();
    const preferences = createPostListPreferences(storage);

    preferences.layout.set("row");
    preferences.tilesPerRow.set(6);
    preferences.hdTilesEnabled.set(false);
    const restored = createPostListPreferences(storage);

    expect([restored.layout.value, restored.tilesPerRow.value, restored.hdTilesEnabled.value]).toEqual(["row", 6, false]);
  });
});

describe("createLightboxPreferences", () => {
  test("falls back to the default volume for one outside 0 to 1", () => {
    const storage = new MemoryLocalKeyedValues();

    storage.set("volume", 2);
    expect(createLightboxPreferences(storage).volume.value).toBe(1);
  });

  test("keeps the details panel closed until it is opened", () => {
    const storage = new MemoryLocalKeyedValues();

    expect(createLightboxPreferences(storage).detailsOpen.value).toBe(false);
    createLightboxPreferences(storage).detailsOpen.set(true);
    expect(createLightboxPreferences(storage).detailsOpen.value).toBe(true);
  });

  test("shows details tags by category, left aligned, at medium size by default", () => {
    const { detailsOrganization, detailsAlignment, detailsSize } = createLightboxPreferences(new MemoryLocalKeyedValues());

    expect([detailsOrganization.value, detailsAlignment.value, detailsSize.value]).toEqual(["category", "start", "medium"]);
  });

  test("falls back to the default details size for an unknown one", () => {
    const storage = new MemoryLocalKeyedValues();

    storage.set("detailsSize", "huge");
    expect(createLightboxPreferences(storage).detailsSize.value).toBe("medium");
  });
});
