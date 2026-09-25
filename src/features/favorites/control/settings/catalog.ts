import { ActionBarButton, ActionBarMode, setActionBarButtons, setActionBarMode } from "@/lib/ui/thumb/action_bar";
import { DiscreteRating, Rating, SortKey } from "@/types/search";
import { EnableRule, enableWhen } from "@/lib/ui/settings/enable_rule";
import { Layout, PerformanceProfile, UpscaleQuality } from "@/types/app";
import { SettingsControl, dropdown, multiSegmented, segmented, slider, stepper, toggle } from "@/lib/ui/settings/controls";
import { applyTheme, swapNativeStylesheet, toggleGradient } from "@/lib/ui/theme/apply";
import { toggleGalleryMenuEnabled, toggleHeader, toggleNativeFont, toggleThemedGalleryBackground } from "@/lib/ui/toggles";
import { AppContext } from "@/app/context/context";
import { Environment } from "@/app/context/environment";
import { Events } from "@/app/context/events";
import { FavoritesConfig } from "@/config/favorites_config";
import { GalleryUpscaleConfig } from "@/config/gallery_upscale_config";
import { GeneralConfig } from "@/config/general_config";
import { Preferences } from "@/app/context/preferences";
import { Theme } from "@/lib/ui/theme/themes";
import { ThumbConfig } from "@/config/thumb_config";
import { ToggleSetting } from "@/lib/ui/settings/setting";
import { booleanPreference } from "@/lib/storage/preference";
import { reloadWindow } from "@/utils/browser/window";
import { themeOptions } from "@/lib/ui/theme/builder";

export type SettingsCatalog = ReturnType<typeof buildSettingsCatalog>;
export type SettingKey = keyof SettingsCatalog;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export function buildSettingsCatalog(context: AppContext) {
  const { preferences, environment, events, flags } = context;
  return {
    theme: dropdown<Theme>({
      id: "theme",
      tooltip: "Choose color theme",
      label: "Theme",
      preference: preferences.app.theme,
      apply: () => applyCurrentTheme(preferences),
      options: themeOptions()
    }),
    darkMode: toggleWithHotkey({
      id: "dark-mode",
      label: "Dark Mode",
      tooltip: "Use dark variant of selected color theme",
      preference: preferences.app.darkMode,
      hotkey: "D",
      apply: (dark) => applyDarkMode(preferences, environment, dark)
    }, events),
    nativeFont: toggleWithHotkey({
      id: "native-font",
      label: "Native Font",
      tooltip: "Use native site font",
      preference: preferences.app.nativeFont,
      apply: toggleNativeFont
    }, events),
    fadeThumbs: toggleWithHotkey({
      id: "fade-thumbs",
      label: "Fade In Thumbnails",
      tooltip: "Fade thumbnails in as they load (applies on reload)",
      preference: preferences.app.fadeThumbs,
      apply: reloadWindow
    }, events),
    upscale: toggleWithHotkey({
      id: "upscale",
      label: "Upscale Thumbnails",
      tooltip: "Upscale thumbnails for higher quality",
      enabled: flags.galleryEnabled,
      preference: preferences.favorites.upscaleThumbs
    }, events),
    upscaleQuality: segmented<UpscaleQuality>({
      id: "upscale-quality",
      label: "Upscale Quality",
      tooltip: "Set upscaled thumbnail resolution. Higher values are sharper but use more graphics memory",
      enabled: flags.galleryEnabled && !GalleryUpscaleConfig.dynamicQuality,
      preference: preferences.favorites.upscaleQuality,
      enabledWhen: whenUpscaling(preferences),
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
      applyOnBuild: true,
      options: new Map<Layout, string>([
        ["column", "Waterfall"],
        ...(environment.onMobileDevice ? [] : [["row", "River"] as [Layout, string]]),
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
      max: environment.onMobileDevice ? ThumbConfig.columnCountBounds.max.mobile : ThumbConfig.columnCountBounds.max.desktop,
      step: 1,
      enabledWhen: whenLayout(preferences, (layout) => layout !== "row" && layout !== "native")
    }),
    rowHeight: stepper({
      id: "row-size",
      label: "Row Height",
      tooltip: "Set row height for river layout",
      preference: preferences.favorites.rowHeight,
      min: ThumbConfig.rowHeightBounds.min,
      max: ThumbConfig.rowHeightBounds.max,
      step: 1,
      enabledWhen: whenLayout(preferences, (layout) => layout === "row")
    }),
    header: toggleWithHotkey({
      id: "toggle-header",
      label: "Site Header",
      tooltip: "Show site header",
      preference: preferences.favorites.headerEnabled,
      applyOnBuild: true,
      apply: toggleHeader
    }, events),
    gradient: toggleWithHotkey({
      id: "toggle-gradient",
      label: "Gradient",
      tooltip: "Use gradient menu background",
      preference: preferences.app.gradient,
      applyOnBuild: true,
      apply: toggleGradient
    }, events),
    autoplay: toggleWithHotkey({
      id: "enable-autoplay",
      label: "Autoplay",
      tooltip: "Automatically traverse gallery",
      enabled: flags.galleryEnabled,
      preference: preferences.gallery.autoplayActive
    }, events),
    mobileGallery: toggleWithHotkey({
      id: "enable-mobile-gallery",
      label: "Gallery",
      enabled: flags.galleryEnabled,
      preference: preferences.gallery.mobileEnabled
    }, events),
    fullscreenOnHover: toggleWithHotkey({
      id: "show-on-hover",
      label: "Enlarge on hover",
      tooltip: "Enlarge content on hover",
      enabled: flags.galleryEnabled,
      preference: preferences.gallery.previewEnabled
    }, events),
    themedBackground: toggleWithHotkey({
      id: "themed-background",
      label: "Themed Background",
      tooltip: "Use the current theme's background color for the gallery instead of black",
      enabled: flags.galleryEnabled,
      preference: preferences.gallery.themedBackground,
      apply: toggleThemedGalleryBackground
    }, events),
    backgroundOpacity: slider({
      id: "background-opacity",
      label: "Background Opacity",
      tooltip: "Set gallery background opacity",
      enabled: flags.galleryEnabled,
      preference: preferences.gallery.backgroundOpacity,
      min: 0,
      max: 1,
      step: 0.05
    }),
    galleryMenu: toggleWithHotkey({
      id: "enable-gallery-menu",
      label: "Menu",
      tooltip: "Show gallery sidebar",
      enabled: flags.galleryEnabled && GeneralConfig.galleryMenuOptionEnabled,
      apply: toggleGalleryMenuEnabled,
      preference: preferences.gallery.menuEnabled
    }, events),
    enhanceSearchPages: toggleWithHotkey({
      id: "enhance-post-lists",
      label: "Enhance Search Pages",
      tooltip: "Enable gallery and browser on search pages",
      preference: preferences.postList.enabled
    }, events),
    infiniteScroll: toggleWithHotkey({
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
      applyOnBuild: true,
      apply: setActionBarMode,
      options: new Map<ActionBarMode, string>([
        ["always", "Always"],
        ["hover", "Hover"],
        ["off", "Off"]
      ])
    }),
    postActionBarToggle: toggleWithHotkey({
      id: "post-action-bar-toggle",
      label: "Show Actions",
      tooltip: "Show actions on thumbnails",
      preference: booleanPreference<ActionBarMode>(preferences.favorites.postActionBar, "always", "off"),
      applyOnBuild: true,
      apply: (on) => setActionBarMode(on ? "always" : "off")
    }, events),
    postActionBarButtons: multiSegmented<ActionBarButton>({
      id: "post-action-bar-buttons",
      label: "Action Buttons",
      tooltip: "Choose which actions appear on thumbnails",
      preference: preferences.favorites.postActionBarButtons,
      applyOnBuild: true,
      apply: setActionBarButtons,
      requireSelection: true,
      options: new Map<ActionBarButton, string>([
        [ActionBarButton.Favorite, "Favorite"],
        [ActionBarButton.Download, "Download"],
        [ActionBarButton.Open, "Open"]
      ])
    }),
    excludeBlacklist: toggleWithHotkey({
      id: "exclude-blacklist",
      label: "Exclude Blacklist",
      tooltip: "Exclude favorites with blacklisted tags from search",
      enabled: environment.userIsOnTheirOwnFavoritesPage,
      preference: preferences.favorites.excludeBlacklist
    }, events),
    rating: multiSegmented<Rating>({
      id: "allowed-ratings",
      label: "Rating",
      tooltip: "Choose which content ratings to include in search results",
      preference: preferences.favorites.allowedRatings,
      requireSelection: true,
      options: new Map<Rating, string>([
        [DiscreteRating.Explicit, "Explicit"],
        [DiscreteRating.Questionable, "Questionable"],
        [DiscreteRating.Safe, "Safe"]
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
        ["lastChangedTimestamp", "Date Changed"],
        ["duration", "Duration"],
        ["random", "Random"]
      ])
    }),
    sortAscending: toggleWithHotkey({
      id: "sort-ascending",
      label: "Sort Ascending",
      tooltip: "Sort search results in ascending order",
      preference: preferences.favorites.sortAscending
    }, events),
    resultsPerPage: stepper({
      id: "results-per-page",
      label: "Results Per Page",
      tooltip: "Set search result count per page",
      preference: preferences.favorites.resultsPerPage,
      min: FavoritesConfig.resultsPerPageBounds.min,
      max: FavoritesConfig.resultsPerPageBounds.max,
      step: FavoritesConfig.resultsPerPageStep,
      enabledWhen: whenNotInfiniteScroll(preferences)
    }),
    tooltip: toggleWithHotkey({
      id: "show-tooltips",
      label: "Tag Tooltip",
      tooltip: "Show all tags when hovering over a thumbnail and see which ones were matched by the latest search",
      enabled: flags.tooltipEnabled,
      preference: preferences.favorites.tooltipEnabled,
      enabledWhen: whenNotFullscreenOnHover(preferences),
      hotkey: "T"
    }, events),
    postOverlay: toggleWithHotkey({
      id: "show-post-overlay",
      label: "Tag Overlay",
      tooltip: "Show tag overlay on thumbnails",
      enabled: flags.postOverlayEnabled,
      preference: preferences.postOverlay.enabled,
      enabledWhen: whenNotFullscreenOnHover(preferences),
      hotkey: "O"
    }, events),
    hints: toggleWithHotkey({
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
      apply: reloadWindow,
      tooltipPosition: "below",
      options: new Map<PerformanceProfile, string>([
        ["normal", "Normal"],
        ["low", "Low"],
        ["potato", "Potato"]
      ])
    })
  };
}

function toggleWithHotkey(config: Partial<ToggleSetting>, events: Events): SettingsControl {
  return toggle({ registerHotkey: (key, fire) => registerHotkey(events, key, fire), ...config });
}

function registerHotkey(events: Events, key: string, fire: () => void): void {
  events.app.hotkeyPressed.on((pressed) => {
    if (pressed === key.toLowerCase()) {
      fire();
    }
  });
}

function whenLayout(preferences: Preferences, predicate: (layout: Layout) => boolean): EnableRule {
  return enableWhen(preferences.favorites.layout, predicate);
}

function whenNotInfiniteScroll(preferences: Preferences): EnableRule {
  return enableWhen(preferences.favorites.infiniteScroll, (on) => !on);
}

function whenNotFullscreenOnHover(preferences: Preferences): EnableRule {
  return enableWhen(preferences.gallery.previewEnabled, (on) => !on);
}

function whenUpscaling(preferences: Preferences): EnableRule {
  return enableWhen(preferences.favorites.upscaleThumbs, (on) => on);
}

function applyCurrentTheme(preferences: Preferences): void {
  applyTheme(preferences.app.theme.value, preferences.app.darkMode.value);
}

function applyDarkMode(preferences: Preferences, environment: Environment, dark: boolean): void {
  applyCurrentTheme(preferences);
  swapNativeStylesheet(dark, environment.onDesktopDevice);
}
