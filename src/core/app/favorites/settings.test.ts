import { describe, expect, test } from "vitest";
import { createFavoritesPreferences } from "@/core/app/preferences";
import { createFavoritesSettings } from "@/core/app/favorites/settings";

describe("createFavoritesSettings", () => {
  test("disables results per page while infinite scroll is on", () => {
    const stored = new Map<string, unknown>();
    const preferences = createFavoritesPreferences({ get: key => stored.get(key), set: (key, value) => stored.set(key, value) });
    const pageSize = createFavoritesSettings(preferences).find(setting => setting.id === "pageSize")!;

    preferences.infiniteScroll.set(true);

    expect(pageSize.disabled?.value).toBe(true);
  });
});
