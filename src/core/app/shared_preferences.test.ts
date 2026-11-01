import { describe, expect, test } from "vitest";
import { MemoryHostPage } from "@/adapters/memory/ports/host_page/memory_host_page";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { createAppStorage } from "@/core/app/app_storage";
import { createSharedPreferences } from "@/core/app/shared_preferences";

function setup(): { localKeyedValues: MemoryLocalKeyedValues; hostPage: MemoryHostPage; sharedPreferences: ReturnType<typeof createSharedPreferences> } {
  const localKeyedValues = new MemoryLocalKeyedValues();
  const hostPage = new MemoryHostPage();
  const sharedPreferences = createSharedPreferences(createAppStorage(localKeyedValues).preferences, "dark", hostPage);
  return { localKeyedValues, hostPage, sharedPreferences };
}

describe("createSharedPreferences", () => {
  test("reads the color scheme the host page was found in", () => {
    expect(setup().sharedPreferences.colorScheme.value).toBe("dark");
  });

  test("hands a color scheme change to the host page without storing it", () => {
    const { localKeyedValues, hostPage, sharedPreferences } = setup();

    sharedPreferences.colorScheme.set("light");
    expect([hostPage.colorScheme, localKeyedValues.get("favorites-search-gallery")]).toEqual(["light", undefined]);
  });

  test("stores the theme under the shared preferences", () => {
    const { localKeyedValues, sharedPreferences } = setup();

    sharedPreferences.theme.set("cherry");
    expect(localKeyedValues.get("favorites-search-gallery")).toEqual({ preferences: { shared: { theme: "cherry" } } });
  });
});
