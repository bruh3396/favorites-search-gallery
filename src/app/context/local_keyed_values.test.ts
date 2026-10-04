import { describe, expect, test } from "vitest";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { createLocalKeyedValues } from "@/app/context/local_keyed_values";

describe("createLocalKeyedValues", () => {
  test("keeps every key under one favorites-search-gallery key", () => {
    const store = new MemoryLocalKeyedValues();

    createLocalKeyedValues(store).set("searchHistory", ["cat"]);

    expect(store.get("favorites-search-gallery")).toEqual({ searchHistory: ["cat"] });
    expect(store.get("searchHistory")).toBeUndefined();
  });

  const LEGACY_KEYS = ["preferences", "searchHistory", "lastEditedSearchQuery", "aspectRatios", "searchSnippets"];

  test.each(LEGACY_KEYS)("moves the bare %s key under favorites-search-gallery", key => {
    const store = new MemoryLocalKeyedValues();

    store.set(key, ["kept"]);

    expect(createLocalKeyedValues(store).get(key)).toEqual(["kept"]);
    expect(store.get(key)).toBeUndefined();
  });

  test("leaves keys the app never wrote", () => {
    const store = new MemoryLocalKeyedValues();

    store.set("otherScript", 1);
    createLocalKeyedValues(store);

    expect(store.get("otherScript")).toBe(1);
  });
});
