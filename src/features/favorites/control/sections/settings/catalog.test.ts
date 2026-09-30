/* eslint-disable no-spaced-func, func-call-spacing -- false positive: arrow function types inside test.each's generic confuse these rules */
import * as FavoritesSettingsCatalog from "@/features/favorites/control/sections/settings/catalog";
import { Preference, booleanPreference } from "@/lib/storage/preference";
import { afterEach, describe, expect, test } from "vitest";
import { AppContext } from "@/app/context/context";
import { Feature } from "@/core/context/features";
import { GalleryUpscaleConfig } from "@/config/gallery_upscale_config";
import { PreferenceOverrides } from "@/testing/preferences";
import { createAppContext } from "@/testing/context";

type SettingKey = FavoritesSettingsCatalog.SettingKey;

interface Setup {
  context: AppContext;
  build: (key: SettingKey) => HTMLElement;
}

function setup(preferences: PreferenceOverrides = {}, features?: Feature[]): Setup {
  const context = createAppContext({ preferences, features });
  const catalog = FavoritesSettingsCatalog.buildSettingsCatalog(context);
  return { context, build: (key) => catalog[key]() };
}

function isDisabled(row: HTMLElement): boolean {
  return row.dataset.disabled !== undefined;
}

const DEFAULT_DYNAMIC_QUALITY = GalleryUpscaleConfig.dynamicQuality;

describe("FavoritesSettingsCatalog", () => {
  afterEach(() => {
    GalleryUpscaleConfig.dynamicQuality = DEFAULT_DYNAMIC_QUALITY;
  });

  describe("hotkeys", () => {
    test.each<[string, SettingKey, (context: AppContext) => Preference<boolean>]>([
      ["d", "darkMode", ({ preferences }): Preference<boolean> => booleanPreference(preferences.app.colorScheme, "dark", "light")],
      ["h", "hints", ({ preferences }): Preference<boolean> => preferences.favorites.hintsEnabled],
      ["o", "postOverlay", ({ preferences }): Preference<boolean> => preferences.postOverlay.enabled],
      ["t", "tooltip", ({ preferences }): Preference<boolean> => preferences.favorites.tooltipEnabled]
    ])("'%s' toggles %s", (key, setting, preferenceOf) => {
      const { context, build } = setup();
      const preference = preferenceOf(context);
      const before = preference.value;

      build(setting);
      context.events.app.hotkeyPressed.emit(key);
      expect(preference.value).toBe(!before);
      context.events.app.hotkeyPressed.emit(key);
      expect(preference.value).toBe(before);
    });

    test("other keys leave the setting alone", () => {
      const { context, build } = setup({ favorites: { hintsEnabled: true } });

      build("hints");
      context.events.app.hotkeyPressed.emit("x");
      expect(context.preferences.favorites.hintsEnabled.value).toBe(true);
    });
  });

  describe("settings that only apply in some modes", () => {
    test.each<[SettingKey, string, (context: AppContext, on: boolean) => void]>([
      ["columnCount", "the row layout", ({ preferences }, on): void => preferences.favorites.layout.set(on ? "row" : "column")],
      ["columnCount", "the native layout", ({ preferences }, on): void => preferences.favorites.layout.set(on ? "native" : "grid")],
      ["rowHeight", "any layout but row", ({ preferences }, on): void => preferences.favorites.layout.set(on ? "square" : "row")],
      ["resultsPerPage", "infinite scroll", ({ preferences }, on): void => preferences.favorites.infiniteScroll.set(on)],
      ["sortAscending", "random sort", ({ preferences }, on): void => preferences.favorites.sortKey.set(on ? "random" : "score")],
      ["tooltip", "enlarge on hover", ({ preferences }, on): void => preferences.gallery.previewEnabled.set(on)],
      ["postOverlay", "enlarge on hover", ({ preferences }, on): void => preferences.gallery.previewEnabled.set(on)]
    ])("%s is disabled during %s", (setting, _mode, enterMode) => {
      const { context, build } = setup();
      const row = build(setting);

      enterMode(context, true);
      expect(isDisabled(row)).toBe(true);
      enterMode(context, false);
      expect(isDisabled(row)).toBe(false);
    });

    test("upscale quality is picked by hand only while upscaling without dynamic quality", () => {
      const { context, build } = setup({ favorites: { upscaleThumbs: false } });

      GalleryUpscaleConfig.dynamicQuality = false;
      const row = build("upscaleQuality");

      expect(isDisabled(row)).toBe(true);
      context.preferences.favorites.upscaleThumbs.set(true);
      expect(isDisabled(row)).toBe(false);
    });

    test("upscale quality follows dynamic quality instead of the user", () => {
      const { build } = setup({ favorites: { upscaleThumbs: true } });

      GalleryUpscaleConfig.dynamicQuality = true;
      expect(isDisabled(build("upscaleQuality"))).toBe(true);
    });

    test("gallery settings are unavailable when the gallery isn't running", () => {
      const { context, build } = setup({ gallery: { autoplayActive: false } }, ["favorites"]);
      const row = build("autoplay");

      row.click();
      expect(isDisabled(row)).toBe(true);
      expect(context.preferences.gallery.autoplayActive.value).toBe(false);
    });
  });
});
