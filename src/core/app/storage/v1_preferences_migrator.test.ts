import { describe, expect, test } from "vitest";
import { APP_STORAGE_SCHEMA } from "@/core/app/storage/app_storage_schema";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { createAppStorage } from "@/core/app/storage/app_storage";
import { createStoredTree } from "@/core/utils/storage/stored_tree";
import { migrateV1Preferences } from "@/core/app/storage/v1_preferences_migrator";

function createLocalKeyedValues(v1Preferences: unknown): MemoryLocalKeyedValues {
  const localKeyedValues = new MemoryLocalKeyedValues();

  localKeyedValues.set("preferences", v1Preferences);
  return localKeyedValues;
}

function readPreferences(localKeyedValues: MemoryLocalKeyedValues): Record<string, unknown> {
  const { shared, favorites, postList } = createStoredTree(
    APP_STORAGE_SCHEMA.preferences,
    createAppStorage(localKeyedValues).preferences,
    ["shared", "favorites", "postList"]
  );
  return {
    theme: shared.theme.peek(),
    postListEnabled: shared.postListEnabled.peek(),
    favoritesNativeHeaderVisible: favorites.nativeHeaderVisible.peek(),
    favoritesLayout: favorites.grid.layout.peek(),
    postListLayout: postList.grid.layout.peek(),
    favoritesHdTilesEnabled: favorites.grid.hdTilesEnabled.peek(),
    postListHdTilesEnabled: postList.grid.hdTilesEnabled.peek()
  };
}

const DEFAULT_PREFERENCES = readPreferences(new MemoryLocalKeyedValues());

describe("migrateV1Preferences", () => {
  test("sets each 1.x preference on its 2.0 preference", () => {
    const localKeyedValues = createLocalKeyedValues({
      appTheme: "dusk",
      postListEnabled: true,
      favoritesHeaderEnabled: false,
      favoritesLayout: "row",
      postListLayout: "grid",
      favoritesUpscaleThumbs: false,
      postListUpscaleThumbs: false
    });

    migrateV1Preferences(localKeyedValues);

    expect(readPreferences(localKeyedValues)).toEqual({
      theme: "dusk",
      postListEnabled: true,
      favoritesNativeHeaderVisible: false,
      favoritesLayout: "row",
      postListLayout: "grid",
      favoritesHdTilesEnabled: false,
      postListHdTilesEnabled: false
    });
  });

  test("sets the 1.x native theme as the rule34 theme", () => {
    const localKeyedValues = createLocalKeyedValues({ appTheme: "dusk" });

    migrateV1Preferences(localKeyedValues);
    localKeyedValues.set("preferences", { appTheme: "native" });
    migrateV1Preferences(localKeyedValues);

    expect(readPreferences(localKeyedValues)).toMatchObject({ theme: "rule34" });
  });

  test("keeps the 2.0 default for missing and invalid 1.x preferences", () => {
    const localKeyedValues = createLocalKeyedValues({ appTheme: "neon", postListEnabled: "yes", favoritesLayout: "masonry", unrelated: 1 });

    migrateV1Preferences(localKeyedValues);

    expect(readPreferences(localKeyedValues)).toEqual(DEFAULT_PREFERENCES);
  });

  test("removes the 1.x preferences once migrated", () => {
    const localKeyedValues = createLocalKeyedValues({ appTheme: "dusk" });

    migrateV1Preferences(localKeyedValues);

    expect(localKeyedValues.get("preferences")).toBeUndefined();
  });

  test("leaves a 1.x preferences value that isn't a record untouched", () => {
    const localKeyedValues = createLocalKeyedValues(["dusk"]);

    migrateV1Preferences(localKeyedValues);

    expect(localKeyedValues.get("preferences")).toEqual(["dusk"]);
    expect(readPreferences(localKeyedValues)).toEqual(DEFAULT_PREFERENCES);
  });
});
