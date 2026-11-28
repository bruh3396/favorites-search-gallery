import { isBoolean, isRecord } from "@/core/utils/guard/unknown_utilities";
import { APP_STORAGE_SCHEMA } from "@/core/app/storage/app_storage_schema";
import { GRID_LAYOUTS } from "@/core/ui/post_grid/layout/grid_layout";
import { Guard } from "@/core/utils/guard/guard";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { StoredValue } from "@/core/utils/storage/stored_value";
import { THEMES } from "@/core/ui/theme/theme";
import { createAppStorage } from "@/core/app/storage/app_storage";
import { createOneOfGuard } from "@/core/utils/guard/one_of_guard";
import { createStoredTree } from "@/core/utils/storage/stored_tree";

const V1_PREFERENCES_KEY = "preferences";
const isTheme = createOneOfGuard(THEMES);
const isGridLayout = createOneOfGuard(GRID_LAYOUTS);

export function migrateV1Preferences(localKeyedValues: LocalKeyedValues): void {
  const v1Preferences = localKeyedValues.get(V1_PREFERENCES_KEY);

  if (!isRecord(v1Preferences)) {
    return;
  }
  const { shared, favorites, postList } = createStoredTree(
    APP_STORAGE_SCHEMA.preferences,
    createAppStorage(localKeyedValues).preferences,
    ["shared", "favorites", "postList"]
  );

  setIfValid(shared.theme, v1Preferences.appTheme === "native" ? "rule34" : v1Preferences.appTheme, isTheme);
  setIfValid(shared.postListEnabled, v1Preferences.postListEnabled, isBoolean);
  setIfValid(favorites.nativeHeaderVisible, v1Preferences.favoritesHeaderEnabled, isBoolean);
  setIfValid(favorites.grid.layout, v1Preferences.favoritesLayout, isGridLayout);
  setIfValid(postList.grid.layout, v1Preferences.postListLayout, isGridLayout);
  setIfValid(favorites.grid.hdTilesEnabled, v1Preferences.favoritesUpscaleThumbs, isBoolean);
  setIfValid(postList.grid.hdTilesEnabled, v1Preferences.postListUpscaleThumbs, isBoolean);
  localKeyedValues.remove(V1_PREFERENCES_KEY);
}

function setIfValid<T>(storedValue: StoredValue<T>, v1Value: unknown, isValue: Guard<T>): void {
  if (isValue(v1Value)) {
    storedValue.set(v1Value);
  }
}
