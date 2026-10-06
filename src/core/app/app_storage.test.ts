import { describe, expect, test } from "vitest";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { createAppStorage } from "@/core/app/app_storage";

describe("createAppStorage", () => {
  test("keeps app values under the app's one key, with preferences in their own section", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const { app, preferences } = createAppStorage(localKeyedValues);

    app.set("favoritesSkeleton", []);
    preferences.set("postGridSize", 4);
    expect(localKeyedValues.get("favorites-search-gallery")).toEqual({ favoritesSkeleton: [], preferences: { postGridSize: 4 } });
  });
});
