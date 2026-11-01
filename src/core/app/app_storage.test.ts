import { describe, expect, test } from "vitest";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { createAppStorage } from "@/core/app/app_storage";

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
});
