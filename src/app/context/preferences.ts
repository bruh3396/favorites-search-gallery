import { ActionBarButton, ActionBarMode } from "@/lib/ui/thumb/action_bar";
import { Layout, PerformanceProfile, PostOverlayMode } from "@/types/app";
import { Rating, SortKey } from "@/types/search";
import { ColorScheme } from "@/core/boundary/environment";
import { FavoritesDrawerSectionName } from "@/types/favorites_ui";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values";
import { NamespacedLocalKeyedValues } from "@/core/utils/storage/namespaced_local_keyed_values";
import { Preference } from "@/lib/storage/preference";
import { PreferenceDefaults } from "@/app/context/preference_defaults";
import { Theme } from "@/lib/ui/theme/themes";

const NAMESPACE = "preferences";

export type Preferences = ReturnType<typeof createPreferences>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export function createPreferences(defaults: PreferenceDefaults, store: LocalKeyedValues) {
  const namespacedLocalKeyedValues = new NamespacedLocalKeyedValues(store, NAMESPACE);
  const preference = <T>(key: string, defaultValue: T): Preference<T> => new Preference(namespacedLocalKeyedValues, key, defaultValue);
  return {
    reset: (): void => namespacedLocalKeyedValues.clear(),

    app: {
      colorScheme: preference<ColorScheme>("appColorScheme", defaults.colorScheme),
      fadeThumbs: preference<boolean>("appFadeThumbs", false),
      gradient: preference("appGradient", false),
      nativeFont: preference<boolean>("appNativeFont", true),
      performanceProfile: preference<PerformanceProfile>("appPerformanceProfile", "normal"),
      theme: preference<Theme>("appTheme", "native")
    },

    favorites: {
      allowedRatings: preference<Rating>("favoritesAllowedRatings", 7),
      columnCount: preference("favoritesColumnCount", defaults.favoritesColumnCount),
      downloadBatchSize: preference("favoritesDownloadBatchSize", 500),
      downloadFilenameFormat: preference("favoritesDownloadFilenameFormat", 3),
      drawerActiveSection: preference<FavoritesDrawerSectionName>("favoritesDrawerActiveView", "settings"),
      drawerOpen: preference("favoritesDrawerOpen", false),
      excludeBlacklist: preference("favoritesExcludeBlacklist", false),
      headerEnabled: preference("favoritesHeaderEnabled", true),
      hintsEnabled: preference("favoritesHintsEnabled", defaults.favoritesHintsEnabled),
      infiniteScroll: preference("favoritesInfiniteScroll", defaults.favoritesInfiniteScroll),
      layout: preference<Layout>("favoritesLayout", "column"),
      postActionBar: preference<ActionBarMode>("favoritesPostActionBar", defaults.favoritesPostActionBar),
      postActionBarButtons: preference("favoritesPostActionBarButtons", defaults.favoritesPostActionBarButtons),
      resultsPerPage: preference("favoritesResultsPerPage", 50),
      rowHeight: preference("favoritesRowHeight", 5),
      settingsExpandedSections: preference<Record<string, boolean>>("favoritesSettingsExpandedSections", {}),
      sortAscending: preference("favoritesSortAscending", false),
      sortKey: preference<SortKey>("favoritesSortKey", "default"),
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
      mode: preference<PostOverlayMode>("postOverlayMode", "tag")
    },

    postList: {
      columnCount: preference("postListColumnCount", defaults.postListColumnCount),
      enabled: preference("postListEnabled", false),
      favoriteIndicator: preference("postListFavoriteIndicator", false),
      infiniteScroll: preference("postListInfiniteScroll", false),
      layout: preference<Layout>("postListLayout", "column"),
      postActionBar: preference<ActionBarMode>("postListPostActionBar", defaults.postListPostActionBar),
      postActionBarButtons: preference("postListPostActionBarButtons", ActionBarButton.Favorite),
      rowHeight: preference("postListRowHeight", 7),
      settingsCollapsed: preference("postListSettingsCollapsed", false),
      tooltipEnabled: preference("postListTooltipEnabled", false),
      upscaleQuality: preference("postListUpscaleQuality", 1),
      upscaleThumbs: preference("postListUpscaleThumbs", defaults.postListUpscaleThumbs)
    }
  };
}
