import { APP_STORAGE_SCHEMA, AppPreferences } from "@/core/app/app_storage_schema";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { FavoritesSettings } from "@/core/app/favorites/settings/favorites_settings";
import { MemoryHostPage } from "@/adapters/memory/ports/host_page/memory_host_page";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { createColorSchemePreference } from "@/core/app/color_scheme_preference";
import { createStoredTree } from "@/core/utils/stored_value/stored_tree";

function setup(): { preferences: AppPreferences["favorites"]; queryInput: (label: string) => HTMLInputElement } {
  const { app: appPreferences, favorites: preferences } = createStoredTree(APP_STORAGE_SCHEMA.preferences, new MemoryLocalKeyedValues(), ["app", "favorites"]);
  const { result: element } = render(document, () => (
    <FavoritesSettings
      preferences={preferences}
      appPreferences={appPreferences}
      colorScheme={createColorSchemePreference("light", new MemoryHostPage())}
      onThemePreview={() => undefined}
      scheduler={new MemoryScheduler()}
    />
  ));
  return { preferences, queryInput: label => element.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)! };
}

describe("FavoritesSettings", () => {
  test("disables page size while infinite scroll is on", () => {
    const { preferences, queryInput } = setup();

    preferences.infiniteScroll.set(true);

    expect(queryInput("Page size").disabled).toBe(true);
  });

  test("disables tile size while the layout is native", () => {
    const { preferences, queryInput } = setup();
    const tileSize = queryInput("Size");

    preferences.grid.layout.set("native");
    expect(tileSize.disabled).toBe(true);
    preferences.grid.layout.set("row");
    expect(tileSize.disabled).toBe(false);
  });
});
