import { ActionBarButton, ActionBarMode } from "@/lib/ui/thumb/action_bar";
import { RatingBit, RatingMask, SortKey } from "@/types/search";
import { EnableRule, enableWhen } from "@/lib/ui/settings/enable_rule";
import { Layout, PerformanceProfile, UpscaleQuality } from "@/types/app";
import { SettingsControl, dropdown, multiSegmented, segmented, slider, stepper } from "@/lib/ui/settings/controls";
import { AppContext } from "@/app/context/context";
import { ColorScheme } from "@/core/boundary/environment";
import { Events } from "@/app/context/events";
import { GalleryUpscaleConfig } from "@/config/gallery_upscale_config";
import { Preferences } from "@/app/context/preferences";
import { Theme } from "@/lib/ui/theme/themes";
import { ThumbConfig } from "@/config/thumb_config";
import { ToggleSetting } from "@/lib/ui/settings/setting";
import { booleanPreference } from "@/lib/storage/preference";
import { buildToggleRow } from "@/lib/ui/settings/components/toggle";
import { effect } from "@/core/utils/reactive/signal";
import { themeOptions } from "@/lib/ui/theme/builder";

type ToggleConfig =Partial<ToggleSetting> & Pick<ToggleSetting, "preference">;

export type SettingsCatalog = ReturnType<typeof buildSettingsCatalog>;
export type SettingKey = keyof SettingsCatalog;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export function buildSettingsCatalog(context: AppContext) {
  const { preferences, environment, events, features } = context;
  return {
    theme: dropdown<Theme>({
      id: "theme",
      tooltip: "Choose color theme",
      label: "Theme",
      preference: preferences.app.theme,
      options: themeOptions()
    }),
    darkMode: toggle({
      id: "dark-mode",
      label: "Dark Mode",
      tooltip: "Use dark variant of selected color theme",
      preference: booleanPreference<ColorScheme>(preferences.app.colorScheme, "dark", "light"),
      hotkey: "D"
    }, events),
    nativeFont: toggle({
      id: "native-font",
      label: "Native Font",
      tooltip: "Use native site font",
      preference: preferences.app.nativeFont
    }, events),
    upscale: toggle({
      id: "upscale",
      label: "Upscale Thumbnails",
      tooltip: "Upscale thumbnails for higher quality",
      enabled: features.has("gallery"),
      preference: preferences.favorites.upscaleThumbs
    }, events),
    upscaleQuality: segmented<UpscaleQuality>({
      id: "upscale-quality",
      label: "Upscale Quality",
      tooltip: "Set upscaled thumbnail resolution. Higher values are sharper but use more graphics memory",
      enabled: features.has("gallery"),
      preference: preferences.favorites.upscaleQuality,
      enabledWhen: whenPickingUpscaleQuality(preferences),
      options: new Map<UpscaleQuality, string>([
        [UpscaleQuality.Ultra, "Ultra"],
        [UpscaleQuality.High, "High"],
        [UpscaleQuality.Normal, "Normal"],
        [UpscaleQuality.Low, "Low"]
      ])
    }),
    layout: segmented<Layout>({
      id: "layout-select",
      tooltip: "Choose favorites layout",
      label: "Layout",
      preference: preferences.favorites.layout,
      options: new Map<Layout, string>([
        ["column", "Waterfall"],
        ...(environment.device === "mobile" ? [] : [["row", "River"] as [Layout, string]]),
        ["square", "Square"],
        ["grid", "Grid"],
        ["native", "Native"]
      ])
    }),
    columnCount: stepper({
      id: "column-count",
      label: "Columns",
      tooltip: "Set column count for waterfall, square, and grid layouts",
      preference: preferences.favorites.columnCount,
      min: ThumbConfig.columnCountBounds.min,
      max: environment.device === "mobile" ? ThumbConfig.columnCountBounds.max.mobile : ThumbConfig.columnCountBounds.max.desktop,
      step: 1,
      enabledWhen: whenLayout(preferences, layout => layout !== "row" && layout !== "native")
    }),
    rowHeight: stepper({
      id: "row-size",
      label: "Row Height",
      tooltip: "Set row height for river layout",
      preference: preferences.favorites.rowHeight,
      min: ThumbConfig.rowHeightBounds.min,
      max: ThumbConfig.rowHeightBounds.max,
      step: 1,
      enabledWhen: whenLayout(preferences, layout => layout === "row")
    }),
    header: toggle({
      id: "toggle-header",
      label: "Site Header",
      tooltip: "Show site header",
      preference: preferences.favorites.headerEnabled
    }, events),
    drawerLabels: toggle({
      id: "toggle-drawer-labels",
      label: "Drawer Labels",
      tooltip: "Show labels in the drawer sidebar",
      preference: preferences.favorites.drawerLabelsEnabled
    }, events),
    gradient: toggle({
      id: "toggle-gradient",
      label: "Gradient",
      tooltip: "Use gradient menu background",
      preference: preferences.app.gradient
    }, events),
    autoplay: toggle({
      id: "enable-autoplay",
      label: "Autoplay",
      tooltip: "Automatically traverse gallery",
      enabled: features.has("gallery"),
      preference: preferences.gallery.autoplayActive
    }, events),
    mobileGallery: toggle({
      id: "enable-mobile-gallery",
      label: "Gallery",
      enabled: features.has("gallery"),
      preference: preferences.gallery.mobileEnabled
    }, events),
    fullscreenOnHover: toggle({
      id: "show-on-hover",
      label: "Enlarge on hover",
      tooltip: "Enlarge content on hover",
      enabled: features.has("gallery"),
      preference: preferences.gallery.previewEnabled
    }, events),
    themedBackground: toggle({
      id: "themed-background",
      label: "Themed Background",
      tooltip: "Use the current theme's background color for the gallery instead of black",
      enabled: features.has("gallery"),
      preference: preferences.gallery.themedBackground
    }, events),
    backgroundOpacity: slider({
      id: "background-opacity",
      label: "Background Opacity",
      tooltip: "Set gallery background opacity",
      enabled: features.has("gallery"),
      preference: preferences.gallery.backgroundOpacity,
      min: 0,
      max: 1,
      step: 0.05
    }),
    galleryMenu: toggle({
      id: "enable-gallery-menu",
      label: "Menu",
      tooltip: "Show gallery sidebar",
      enabled: features.has("gallery"),
      preference: preferences.gallery.menuEnabled
    }, events),
    enhanceSearchPages: toggle({
      id: "enhance-post-lists",
      label: "Enhance Search Pages",
      tooltip: "Enable gallery and browser on search pages",
      preference: preferences.postList.enabled
    }, events),
    infiniteScroll: toggle({
      id: "infinite-scroll",
      label: "Infinite Scroll",
      tooltip: "Use infinite scroll (waterfall) instead of paging",
      preference: preferences.favorites.infiniteScroll
    }, events),
    postActionBar: segmented<ActionBarMode>({
      id: "post-action-bar",
      label: "Action Visibility",
      tooltip: "Show actions on thumbnails",
      preference: preferences.favorites.postActionBar,
      options: new Map<ActionBarMode, string>([
        ["always", "Always"],
        ["hover", "Hover"],
        ["off", "Off"]
      ])
    }),
    postActionBarToggle: toggle({
      id: "post-action-bar-toggle",
      label: "Show Actions",
      tooltip: "Show actions on thumbnails",
      preference: booleanPreference<ActionBarMode>(preferences.favorites.postActionBar, "always", "off")
    }, events),
    postActionBarButtons: multiSegmented<ActionBarButton>({
      id: "post-action-bar-buttons",
      label: "Action Buttons",
      tooltip: "Choose which actions appear on thumbnails",
      preference: preferences.favorites.postActionBarButtons,
      requireSelection: true,
      options: new Map<ActionBarButton, string>([
        [ActionBarButton.Favorite, "Favorite"],
        [ActionBarButton.Download, "Download"],
        [ActionBarButton.Open, "Open"]
      ])
    }),
    excludeBlacklist: toggle({
      id: "exclude-blacklist",
      label: "Exclude Blacklist",
      tooltip: "Exclude favorites with blacklisted tags from search",
      enabled: environment.ownsFavorites,
      preference: preferences.favorites.excludeBlacklist
    }, events),
    rating: multiSegmented<RatingMask>({
      id: "allowed-ratings",
      label: "RatingMask",
      tooltip: "Choose which content ratings to include in search results",
      preference: preferences.favorites.allowedRatings,
      requireSelection: true,
      options: new Map<RatingMask, string>([
        [RatingBit.Explicit, "Explicit"],
        [RatingBit.Questionable, "Questionable"],
        [RatingBit.Safe, "Safe"]
      ])
    }),
    sortKey: dropdown<SortKey>({
      id: "sort-key",
      tooltip: "Choose sort order of search results",
      label: "Sort By",
      preference: preferences.favorites.sortKey,
      options: new Map<SortKey, string>([
        ["default", "Default"],
        ["score", "Score"],
        ["width", "Width"],
        ["height", "Height"],
        ["id", "Date Uploaded"],
        ["changedAt", "Date Changed"],
        ["duration", "Duration"],
        ["random", "Random"]
      ])
    }),
    sortAscending: toggle({
      id: "sort-ascending",
      label: "Sort Ascending",
      tooltip: "Sort search results in ascending order",
      preference: preferences.favorites.sortAscending,
      enabledWhen: whenNotSortByRandom(preferences)
    }, events),
    resultsPerPage: stepper({
      id: "results-per-page",
      label: "Results Per Page",
      tooltip: "Set search result count per page",
      preference: preferences.favorites.resultsPerPage,
      min: 1,
      max: 5_000,
      step: 25,
      enabledWhen: whenNotInfiniteScroll(preferences)
    }),
    tooltip: toggle({
      id: "show-tooltips",
      label: "Tag Tooltip",
      tooltip: "Show all tags when hovering over a thumbnail and see which ones were matched by the latest search",
      enabled: features.has("tooltip"),
      preference: preferences.favorites.tooltipEnabled,
      enabledWhen: whenNotFullscreenOnHover(preferences),
      hotkey: "T"
    }, events),
    postOverlay: toggle({
      id: "show-post-overlay",
      label: "Tag Overlay",
      tooltip: "Show tag overlay on thumbnails",
      enabled: features.has("postOverlay"),
      preference: preferences.postOverlay.enabled,
      enabledWhen: whenNotFullscreenOnHover(preferences),
      hotkey: "O"
    }, events),
    hints: toggle({
      id: "show-hints",
      label: "Hints",
      tooltip: "Show hints",
      preference: preferences.favorites.hintsEnabled,
      hotkey: "H"
    }, events),
    performanceProfile: segmented<PerformanceProfile>({
      id: "performance-profile",
      tooltip: "Choose performance profile - Normal: all - Medium: no upscaling - Low: no gallery, Potato: search only",
      label: "Performance",
      preference: preferences.app.performanceProfile,
      tooltipPosition: "below",
      options: new Map<PerformanceProfile, string>([
        ["normal", "Normal"],
        ["low", "Low"],
        ["potato", "Potato"]
      ])
    })
  };
}

function toggle(config: ToggleConfig, events: Events): SettingsControl {
  return (): HTMLElement => {
    const { preference } = config;
    const flip = (): void => preference.set(!preference.value);
    const row = buildToggleRow(config, { onToggle: flip });

    effect(() => row.setChecked(preference.value));
    effect(() => row.setDisabled(!isEnabled(config)));
    registerHotkey(events, config.hotkey, flip);
    return row.element;
  };
}

function isEnabled(config: ToggleConfig): boolean {
  return config.enabled !== false && (config.enabledWhen?.() ?? true);
}

function registerHotkey(events: Events, key: string | undefined, fire: () => void): void {
  if (key === undefined) {
    return;
  }
  events.app.hotkeyPressed.on(pressed => {
    if (pressed === key.toLowerCase()) {
      fire();
    }
  });
}

function whenLayout(preferences: Preferences, predicate: (layout: Layout) => boolean): EnableRule {
  return enableWhen(preferences.favorites.layout, predicate);
}

function whenNotInfiniteScroll(preferences: Preferences): EnableRule {
  return enableWhen(preferences.favorites.infiniteScroll, on => !on);
}

function whenNotFullscreenOnHover(preferences: Preferences): () => boolean {
  return () => !preferences.gallery.previewEnabled.value;
}

function whenPickingUpscaleQuality(preferences: Preferences): EnableRule {
  return enableWhen(preferences.favorites.upscaleThumbs, on => on && !GalleryUpscaleConfig.dynamicQuality);
}

function whenNotSortByRandom(preferences: Preferences): () => boolean {
  return () => preferences.favorites.sortKey.value !== "random";
}
