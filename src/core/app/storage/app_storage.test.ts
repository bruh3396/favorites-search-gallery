import { DEFAULT_THEME, THEMES } from "@/core/ui/theme/theme";
import { describe, expect, test } from "vitest";
import { APP_STORAGE_SCHEMA } from "@/core/app/storage/app_storage_schema";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { createAppStorage } from "@/core/app/storage/app_storage";
import { createStoredTree } from "@/core/utils/storage/stored_tree";

describe("createAppStorage", () => {
  test("keeps preferences and state under one key", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const { preferences: preferencesStoredValueStorage, state: stateStoredValueStorage } = createAppStorage(localKeyedValues);

    preferencesStoredValueStorage.set("shared", { postListEnabled: true });
    stateStoredValueStorage.set("favorites", { 1: { sizes: [] } });
    expect(localKeyedValues.get("favorites-search-gallery")).toEqual({
      preferences: { shared: { postListEnabled: true } },
      state: { favorites: { 1: { sizes: [] } } }
    });
  });

  test("keeps one branch when the other writes", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const { preferences: preferencesStoredValueStorage } = createAppStorage(localKeyedValues);
    const { state: otherTabStateStoredValueStorage } = createAppStorage(localKeyedValues);

    otherTabStateStoredValueStorage.set("favorites", {});
    preferencesStoredValueStorage.set("shared", { theme: "cherry" });
    expect(localKeyedValues.get("favorites-search-gallery")).toEqual({
      preferences: { shared: { theme: "cherry" } },
      state: { favorites: {} }
    });
  });

  test("keeps a sibling preference another tab wrote", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const { shared: sharedPreferences } = createStoredTree(APP_STORAGE_SCHEMA.preferences, createAppStorage(localKeyedValues).preferences, ["shared"]);
    const { shared: otherTabSharedPreferences } = createStoredTree(APP_STORAGE_SCHEMA.preferences, createAppStorage(localKeyedValues).preferences, ["shared"]);
    const postListEnabled = !otherTabSharedPreferences.postListEnabled.peek();

    otherTabSharedPreferences.postListEnabled.set(postListEnabled);
    sharedPreferences.theme.set(THEMES.find(theme => theme !== sharedPreferences.theme.peek()) ?? DEFAULT_THEME);
    expect(createStoredTree(APP_STORAGE_SCHEMA.preferences, createAppStorage(localKeyedValues).preferences, ["shared"]).shared.postListEnabled.peek())
      .toBe(postListEnabled);
  });
});
