import { APP_PREFERENCE_SCHEMA, AppPreferences } from "@/core/app/app_preference_schema";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { FavoritesSettings } from "@/core/app/favorites/favorites_settings";
import { MemoryHostPage } from "@/adapters/memory/ports/host_page/host_page";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { createColorSchemePreference } from "@/core/app/color_scheme_preference";
import { createPreferenceTree } from "@/core/utils/preference/preference_tree";

function setup(): { preferences: AppPreferences["favorites"]; queryInput: (label: string) => HTMLInputElement } {
  const { app: appPreferences, favorites: preferences } = createPreferenceTree(APP_PREFERENCE_SCHEMA, new MemoryLocalKeyedValues(), ["app", "favorites"]);
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
