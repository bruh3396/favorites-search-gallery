import { ActionBarButton, ActionBarMode, setActionBarButtons, setActionBarMode } from "@/lib/ui/thumb/action_bar";
import { DiscreteRating, Rating, SortKey } from "@/types/search";
import { Layout, PerformanceProfile } from "@/types/app";
import { SettingsControl, dropdown, multiSegmented, segmented, slider, stepper } from "@/lib/ui/settings/controls";
import { applyCurrentTheme, applyDarkMode, toggle, whenLayout, whenNotFullscreenOnHover, whenNotInfiniteScroll } from "@/features/favorites/control/settings/helpers";
import { toggleGalleryMenuEnabled, toggleHeader, toggleNativeFont, toggleThemedGalleryBackground } from "@/lib/ui/toggles";
import { AppContext } from "@/app/context/context";
import { FavoritesConfig } from "@/config/favorites_config";
import { GeneralConfig } from "@/config/general_config";
import { Theme } from "@/lib/ui/theme/themes";
import { ThumbConfig } from "@/config/thumb_config";
import { booleanPreference } from "@/lib/storage/preference";
import { reloadWindow } from "@/utils/browser/window";
import { themeOptions } from "@/lib/ui/theme/builder";
import { toggleGradient } from "@/lib/ui/theme/apply";

export type SettingsCatalog = Record<string, SettingsControl>;

export function buildSettingsCatalog(context: AppContext): SettingsCatalog {
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
    darkMode: toggle({
      id: "dark-mode",
      label: "Dark Mode",
      tooltip: "Use dark variant of selected color theme",
      preference: preferences.app.darkMode,
      hotkey: "D",
      apply: (dark) => applyDarkMode(preferences, environment, dark)
    }, events),
    nativeFont: toggle({
      id: "native-font",
      label: "Native Font",
      tooltip: "Use native site font",
      preference: preferences.app.nativeFont,
      apply: toggleNativeFont
    }, events),
    fadeThumbs: toggle({
      id: "fade-thumbs",
      label: "Fade In Thumbnails",
      tooltip: "Fade thumbnails in as they load (applies on reload)",
      preference: preferences.app.fadeThumbs,
      apply: reloadWindow
    }, events),
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
    header: toggle({
      id: "toggle-header",
      label: "Site Header",
      tooltip: "Show site header",
      preference: preferences.favorites.headerEnabled,
      applyOnBuild: true,
      apply: toggleHeader
    }, events),
    gradient: toggle({
      id: "toggle-gradient",
      label: "Gradient",
      tooltip: "Use gradient menu background",
      preference: preferences.app.gradient,
      applyOnBuild: true,
      apply: toggleGradient
    }, events),
    autoplay: toggle({
      id: "enable-autoplay",
      label: "Autoplay",
      tooltip: "Automatically traverse gallery",
      enabled: flags.galleryEnabled,
      preference: preferences.gallery.autoplayActive
    }, events),
    mobileGallery: toggle({
      id: "enable-mobile-gallery",
      label: "Gallery",
      enabled: flags.galleryEnabled,
      preference: preferences.gallery.mobileEnabled
    }, events),
    fullscreenOnHover: toggle({
      id: "show-on-hover",
      label: "Enlarge on hover",
      tooltip: "Enlarge content on hover",
      enabled: flags.galleryEnabled,
      preference: preferences.gallery.previewEnabled
    }, events),
    themedBackground: toggle({
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
    galleryMenu: toggle({
      id: "enable-gallery-menu",
      label: "Menu",
      tooltip: "Show gallery sidebar",
      enabled: flags.galleryEnabled && GeneralConfig.galleryMenuOptionEnabled,
      apply: toggleGalleryMenuEnabled,
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
      applyOnBuild: true,
      apply: setActionBarMode,
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
    excludeBlacklist: toggle({
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
    sortAscending: toggle({
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
    tooltip: toggle({
      id: "show-tooltips",
      label: "Tag Tooltip",
      tooltip: "Show all tags when hovering over a thumbnail and see which ones were matched by the latest search",
      enabled: flags.tooltipEnabled,
      preference: preferences.favorites.tooltipEnabled,
      enabledWhen: whenNotFullscreenOnHover(preferences),
      hotkey: "T"
    }, events),
    postOverlay: toggle({
      id: "show-post-overlay",
      label: "Tag Overlay",
      tooltip: "Show tag overlay on thumbnails",
      enabled: flags.postOverlayEnabled,
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
      apply: reloadWindow,
      tooltipPosition: "below",
      options: new Map<PerformanceProfile, string>([
        ["normal", "Normal"],
        ["medium", "Medium"],
        ...(environment.onMobileDevice ? [] : [["low", "Low"] as [PerformanceProfile, string]]),
        ["potato", "Potato"]
      ])
    })
  };
}
