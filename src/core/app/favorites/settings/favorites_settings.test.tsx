import { APP_STORAGE_SCHEMA } from "@/core/app/app_storage_schema";
import { AppPreferences } from "@/core/app/app_preferences";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { FavoritesSettings } from "@/core/app/favorites/settings/favorites_settings";
import { MemoryHostPage } from "@/adapters/memory/ports/host_page/memory_host_page";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { createSharedPreferences } from "@/core/app/shared_preferences";
import { createStoredTree } from "@/core/utils/storage/stored_tree";

function setup(): { favoritesPreferences: AppPreferences["favorites"]; queryInput: (type: string, label: string) => HTMLInputElement } {
  const localKeyedValues = new MemoryLocalKeyedValues();
  const { favorites: favoritesPreferences } = createStoredTree(APP_STORAGE_SCHEMA.preferences, localKeyedValues, ["favorites"]);
  const { result: element } = render(document, () => (
    <FavoritesSettings
      favoritesPreferences={favoritesPreferences}
      sharedPreferences={createSharedPreferences(localKeyedValues, "light", new MemoryHostPage())}
      onThemePreview={() => undefined}
      stepperScheduler={new MemoryScheduler()}
    />
  ));
  return { favoritesPreferences, queryInput: (type, label) => element.querySelector<HTMLInputElement>(`input[type="${type}"][aria-label="${label}"]`)! };
}

describe("FavoritesSettings", () => {
  test("disables page size while infinite scroll is on", () => {
    const { favoritesPreferences, queryInput } = setup();

    favoritesPreferences.pagination.infiniteScroll.set(true);

    expect(queryInput("number", "Size").disabled).toBe(true);
  });

  test("disables tile size while the layout is native", () => {
    const { favoritesPreferences, queryInput } = setup();
    const tileSize = queryInput("range", "Size");

    favoritesPreferences.grid.layout.set("native");
    expect(tileSize.disabled).toBe(true);
    favoritesPreferences.grid.layout.set("row");
    expect(tileSize.disabled).toBe(false);
  });
});
