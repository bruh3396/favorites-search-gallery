import { describe, expect, test } from "vitest";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { createAppStorage } from "@/core/app/app_storage";

describe("createAppStorage", () => {
  test("keeps app values under the app's one key, with each owner's preferences in its own section", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const { app, appPreferences, favoritesPreferences, postListPreferences, lightboxPreferences } = createAppStorage(localKeyedValues);

    app.set("favoritesSkeleton", []);
    appPreferences.set("postListEnabled", true);
    favoritesPreferences.set("tilesPerRow", 4);
    postListPreferences.set("tilesPerRow", 6);
    lightboxPreferences.set("muted", true);
    expect(localKeyedValues.get("favorites-search-gallery")).toEqual({
      favoritesSkeleton: [],
      preferences: { app: { postListEnabled: true }, favorites: { tilesPerRow: 4 }, postList: { tilesPerRow: 6 }, lightbox: { muted: true } }
    });
  });
});
