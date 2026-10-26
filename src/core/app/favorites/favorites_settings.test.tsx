import {
  FavoritesPreferences, createAppPreferences, createColorSchemePreference, createFavoritesPreferences, createLightboxPreferences
} from "@/core/app/preferences";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import { FavoritesSettings } from "@/core/app/favorites/favorites_settings";
import { MemoryHostPage } from "@/adapters/memory/ports/host_page/host_page";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";

function setup(): { preferences: FavoritesPreferences; queryInput: (label: string) => HTMLInputElement } {
  const stored = new Map<string, unknown>();
  const preferences = createFavoritesPreferences({ get: key => stored.get(key), set: (key, value) => stored.set(key, value) });
  const { result: element } = render(document, () => (
    <FavoritesSettings
      preferences={preferences}
      appPreferences={createAppPreferences({ get: () => undefined, set: () => undefined })}
      lightboxPreferences={createLightboxPreferences({ get: () => undefined, set: () => undefined })}
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

    preferences.layout.set("native");
    expect(tileSize.disabled).toBe(true);
    preferences.layout.set("row");
    expect(tileSize.disabled).toBe(false);
  });
});
