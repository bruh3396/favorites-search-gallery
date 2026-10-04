import { describe, expect, test } from "vitest";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { createLocalKeyedValues } from "@/app/context/local_keyed_values";

describe("createLocalKeyedValues", () => {
  test("keeps every key under one fsg key", () => {
    const store = new MemoryLocalKeyedValues();

    createLocalKeyedValues(store).set("searchHistory", ["cat"]);

    expect(store.get("fsg")).toEqual({ searchHistory: ["cat"] });
    expect(store.get("searchHistory")).toBeUndefined();
  });

  test.each(["preferences", "searchHistory", "lastEditedSearchQuery", "aspectRatios", "searchSnippets"])("moves the bare %s key under fsg", (key) => {
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
