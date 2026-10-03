import { ACTION_BAR_MODES, ActionBarButton, ActionBarMode } from "@/lib/ui/thumb/action_bar";
import { COLOR_SCHEMES, ColorScheme } from "@/core/boundary/environment";
import { FavoritesDrawerSectionName, FavoritesDrawerSectionNames } from "@/types/favorites_ui";
import { Guard, oneOf } from "@/core/utils/guards/guards";
import { LAYOUTS, Layout, PERFORMANCE_PROFILES, POST_OVERLAY_MODES, PerformanceProfile, PostOverlayMode } from "@/types/app";
import { METRICS, RATINGS, Rating, SortKey } from "@/types/search";
import { Preference, StoredPreference } from "@/lib/storage/preference";
import { THEMES, Theme } from "@/lib/ui/theme/themes";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values";
import { NamespacedLocalKeyedValues } from "@/core/utils/storage/namespaced_local_keyed_values";
import { PreferenceDefaults } from "@/app/context/preference_defaults";

const NAMESPACE = "preferences";

export type Preferences = ReturnType<typeof createPreferences>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export function createPreferences(defaults: PreferenceDefaults, store: LocalKeyedValues) {
  const namespacedLocalKeyedValues = new NamespacedLocalKeyedValues(NAMESPACE, store);
  const preference = <T>(key: string, defaultValue: T, accepts?: Guard<T>): Preference<T> => {
    return new StoredPreference({ key, defaultValue }, { store: namespacedLocalKeyedValues, accepts });
  };
  return {
    reset: (): void => namespacedLocalKeyedValues.clear(),

    app: {
      colorScheme: preference<ColorScheme>("appColorScheme", defaults.colorScheme, oneOf(COLOR_SCHEMES)),
      fadeThumbs: preference<boolean>("appFadeThumbs", false),
      gradient: preference("appGradient", false),
      nativeFont: preference<boolean>("appNativeFont", true),
      performanceProfile: preference<PerformanceProfile>("appPerformanceProfile", "normal", oneOf(PERFORMANCE_PROFILES)),
      theme: preference<Theme>("appTheme", "native", oneOf(Object.keys(THEMES) as Theme[]))
    },

    favorites: {
      allowedRatings: preference<Rating>("favoritesAllowedRatings", 7, oneOf(RATINGS)),
      columnCount: preference("favoritesColumnCount", defaults.favoritesColumnCount),
      downloadBatchSize: preference("favoritesDownloadBatchSize", 500),
      downloadFilenameFormat: preference("favoritesDownloadFilenameFormat", 3),
      drawerActiveSection: preference<FavoritesDrawerSectionName>("favoritesDrawerActiveView", "settings", oneOf(FavoritesDrawerSectionNames)),
      drawerOpen: preference("favoritesDrawerOpen", false),
      excludeBlacklist: preference("favoritesExcludeBlacklist", false),
      headerEnabled: preference("favoritesHeaderEnabled", true),
      hintsEnabled: preference("favoritesHintsEnabled", defaults.favoritesHintsEnabled),
      infiniteScroll: preference("favoritesInfiniteScroll", defaults.favoritesInfiniteScroll),
      layout: preference<Layout>("favoritesLayout", "column", oneOf(LAYOUTS)),
      postActionBar: preference<ActionBarMode>("favoritesPostActionBar", defaults.favoritesPostActionBar, oneOf(ACTION_BAR_MODES)),
      postActionBarButtons: preference("favoritesPostActionBarButtons", defaults.favoritesPostActionBarButtons),
      resultsPerPage: preference("favoritesResultsPerPage", 50),
      rowHeight: preference("favoritesRowHeight", 5),
      settingsExpandedSections: preference<Record<string, boolean>>("favoritesSettingsExpandedSections", {}),
      sortAscending: preference("favoritesSortAscending", false),
      sortKey: preference<SortKey>("favoritesSortKey", "default", oneOf(METRICS)),
      tooltipEnabled: preference("favoritesTooltipEnabled", false),
      upscaleQuality: preference("favoritesUpscaleQuality", 1),
      upscaleThumbs: preference("favoritesUpscaleThumbs", true)
    },

    gallery: {
      autoplayActive: preference("galleryAutoplayActive", false),
      autoplayForward: preference("galleryAutoplayForward", true),
      autoplayImageDuration: preference("galleryAutoplayImageDuration", 3_000),
      autoplayMinimumVideoDuration: preference("galleryAutoplayMinimumVideoDuration", 5_000),
      autoplayPaused: preference("galleryAutoplayPaused", false),
      backgroundOpacity: preference("galleryBackgroundOpacity", 1),
      menuDockedLeft: preference("galleryMenuDockedLeft", defaults.galleryMenuDockedLeft),
      menuEnabled: preference("galleryMenuEnabled", defaults.galleryMenuEnabled),
      menuPinned: preference("galleryMenuPinned", defaults.galleryMenuPinned),
      mobileEnabled: preference("galleryMobileEnabled", true),
      previewEnabled: preference("galleryPreviewEnabled", false),
      themedBackground: preference("galleryThemedBackground", false),
      tutorialSeen: preference("galleryTutorialSeen", false),
      videoMuted: preference("galleryVideoMuted", false),
      videoVolume: preference("galleryVideoVolume", 1)
    },

    postOverlay: {
      enabled: preference("postOverlayEnabled", false),
      mode: preference<PostOverlayMode>("postOverlayMode", "tag", oneOf(POST_OVERLAY_MODES))
    },

    postList: {
      columnCount: preference("postListColumnCount", defaults.postListColumnCount),
      enabled: preference("postListEnabled", false),
      favoriteIndicator: preference("postListFavoriteIndicator", false),
      infiniteScroll: preference("postListInfiniteScroll", false),
      layout: preference<Layout>("postListLayout", "column", oneOf(LAYOUTS)),
      postActionBar: preference<ActionBarMode>("postListPostActionBar", defaults.postListPostActionBar, oneOf(ACTION_BAR_MODES)),
      postActionBarButtons: preference("postListPostActionBarButtons", ActionBarButton.Favorite),
      rowHeight: preference("postListRowHeight", 7),
      settingsCollapsed: preference("postListSettingsCollapsed", false),
      tooltipEnabled: preference("postListTooltipEnabled", false),
      upscaleQuality: preference("postListUpscaleQuality", 1),
      upscaleThumbs: preference("postListUpscaleThumbs", defaults.postListUpscaleThumbs)
    }
  };
}
