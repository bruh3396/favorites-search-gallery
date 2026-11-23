import { describe, expect, test, vi } from "vitest";
import { APP_STORAGE_SCHEMA } from "@/core/app/storage/app_storage_schema";
import { MemoryHostPage } from "@/adapters/memory/ports/host_page/memory_host_page";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { composeFavoritesSettings } from "@/core/app/favorites/settings/favorites_settings_composer";
import { createSharedPreferences } from "@/core/app/storage/shared_preferences";
import { createStoredTree } from "@/core/utils/storage/stored_tree";
import { render } from "@/core/ui/h/h";

function setup(): { pane: HTMLElement; resetSettings: () => void } {
  const localKeyedValues = new MemoryLocalKeyedValues();
  const { favorites: favoritesPreferences } = createStoredTree(APP_STORAGE_SCHEMA.preferences, localKeyedValues, ["favorites"]);
  const resetSettings = vi.fn();
  const pane = render(document, () => composeFavoritesSettings({
    favoritesPreferences,
    sharedPreferences: createSharedPreferences(localKeyedValues, "light", new MemoryHostPage()),
    stepperScheduler: new MemoryScheduler(),
    onThemePreview: () => undefined,
    resetSettings
  })).result;
  return { pane, resetSettings };
}

describe("composeFavoritesSettings", () => {
  test("shows the settings under the Settings title", () => {
    const { pane } = setup();

    expect([pane.querySelector("h2")?.textContent, pane.querySelector("input[type=\"number\"][aria-label=\"Size\"]") !== null]).toEqual(["Settings", true]);
  });

  test("resets the settings from its header", () => {
    const { pane, resetSettings } = setup();

    pane.querySelector<HTMLButtonElement>("button[aria-label=\"Reset All Settings\"]")!.click();
    expect(resetSettings).toHaveBeenCalledOnce();
  });
});
