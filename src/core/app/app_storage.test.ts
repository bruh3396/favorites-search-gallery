import { describe, expect, test } from "vitest";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { createAppStorage } from "@/core/app/app_storage";

describe("createAppStorage", () => {
  test("keeps preferences and state under one key each", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const { preferences, state } = createAppStorage(localKeyedValues);

    preferences.set("shared", { postListEnabled: true });
    state.set("favorites", { 1: { sizes: [] } });
    expect([localKeyedValues.get("favorites-search-gallery:preferences"), localKeyedValues.get("favorites-search-gallery:state")]).toEqual([
      { shared: { postListEnabled: true } },
      { favorites: { 1: { sizes: [] } } }
    ]);
  });

  test("never rewrites one branch when the other writes", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const { preferences, state } = createAppStorage(localKeyedValues);
    const writtenKeys: string[] = [];

    preferences.set("shared", { theme: "cherry" });
    const set = localKeyedValues.set.bind(localKeyedValues);
    localKeyedValues.set = (key, value): void => {
      writtenKeys.push(key);
      set(key, value);
    };
    state.set("favorites", {});
    expect(writtenKeys).toEqual(["favorites-search-gallery:state"]);
  });
});
