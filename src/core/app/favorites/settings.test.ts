import {
  FavoritesPreferences, createAppPreferences, createColorSchemePreference, createFavoritesPreferences, createLightboxPreferences
} from "@/core/app/preferences";
import { SettingDescriptor } from "@/core/ui/settings/descriptor";
import { describe, expect, test } from "vitest";
import { MemoryHostPage } from "@/adapters/memory/ports/host_page/host_page";
import { createFavoritesSettings } from "@/core/app/favorites/settings";

function setup(): { preferences: FavoritesPreferences; findSetting: (id: string) => SettingDescriptor } {
  const stored = new Map<string, unknown>();
  const preferences = createFavoritesPreferences({ get: key => stored.get(key), set: (key, value) => stored.set(key, value) });
  const colorScheme = createColorSchemePreference("light", new MemoryHostPage());
  const appPreferences = createAppPreferences({ get: () => undefined, set: () => undefined });
  const lightboxPreferences = createLightboxPreferences({ get: () => undefined, set: () => undefined });
  const settings = createFavoritesSettings(preferences, appPreferences, lightboxPreferences, colorScheme, () => undefined);
  return { preferences, findSetting: id => settings.find(setting => setting.id === id)! };
}

describe("createFavoritesSettings", () => {
  test("disables results per page while infinite scroll is on", () => {
    const { preferences, findSetting } = setup();

    preferences.infiniteScroll.set(true);

    expect(findSetting("pageSize").disabled?.value).toBe(true);
  });

  test("disables tile size while the layout is native", () => {
    const { preferences, findSetting } = setup();
    const tileSize = findSetting("tileSize");

    preferences.layout.set("native");
    expect(tileSize.disabled?.value).toBe(true);
    preferences.layout.set("row");
    expect(tileSize.disabled?.value).toBe(false);
  });
});
