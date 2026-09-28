import { ActionBarButton, ActionBarMode } from "@/lib/ui/thumb/action_bar";
import { Layout, PerformanceProfile, PostOverlayMode } from "@/types/app";
import { Rating, SortKey } from "@/types/search";
import { Environment } from "@/core/boundary/environment";
import { FavoritesDrawerSectionName } from "@/types/favorites_ui";
import { KeyValueStore } from "@/core/boundary/ports/key_value_store";
import { NamespacedStore } from "@/core/utils/storage/namespaced_store";
import { Preference } from "@/lib/storage/preference";
import { Theme } from "@/lib/ui/theme/themes";

const NAMESPACE = "preferences";

export type Preferences = ReturnType<typeof createPreferences>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export function createPreferences(environment: Environment, store: KeyValueStore) {
  const namespacedStore = new NamespacedStore(store, NAMESPACE);
  const preference = <T>(key: string, defaultValue: T): Preference<T> => new Preference(namespacedStore, key, defaultValue);
  const { usingDarkMode } = environment;
  const onDesktopDevice = environment.device === "desktop";
  const onMobileDevice = environment.device === "mobile";
  return {
    reset: (): void => namespacedStore.clear(),

    app: {
      darkMode: preference<boolean>("appDarkMode", usingDarkMode),
      fadeThumbs: preference<boolean>("appFadeThumbs", false),
      gradient: preference("appGradient", false),
      nativeFont: preference<boolean>("appNativeFont", true),
      performanceProfile: preference<PerformanceProfile>("appPerformanceProfile", "normal"),
      theme: preference<Theme>("appTheme", "native")
    },

    favorites: {
      allowedRatings: preference<Rating>("favoritesAllowedRatings", 7),
      columnCount: preference("favoritesColumnCount", onDesktopDevice ? 5 : 2),
      downloadBatchSize: preference("favoritesDownloadBatchSize", 500),
      downloadFilenameFormat: preference("favoritesDownloadFilenameFormat", 3),
      drawerActiveSection: preference<FavoritesDrawerSectionName>("favoritesDrawerActiveView", "settings"),
      drawerOpen: preference("favoritesDrawerOpen", false),
      excludeBlacklist: preference("favoritesExcludeBlacklist", false),
      headerEnabled: preference("favoritesHeaderEnabled", true),
      hintsEnabled: preference("favoritesHintsEnabled", onDesktopDevice),
      infiniteScroll: preference("favoritesInfiniteScroll", onMobileDevice),
      layout: preference<Layout>("favoritesLayout", "column"),
      postActionBar: preference<ActionBarMode>("favoritesPostActionBar", onDesktopDevice ? "hover" : "off"),
      postActionBarButtons: preference("favoritesPostActionBarButtons", onDesktopDevice ? ActionBarButton.Favorite : ActionBarButton.Favorite | ActionBarButton.Open),
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
      menuDockedLeft: preference("galleryMenuDockedLeft", onDesktopDevice),
      menuEnabled: preference("galleryMenuEnabled", onMobileDevice),
      menuPinned: preference("galleryMenuPinned", onMobileDevice),
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
      columnCount: preference("postListColumnCount", onDesktopDevice ? 5 : 2),
      enabled: preference("postListEnabled", false),
      favoriteIndicator: preference("postListFavoriteIndicator", false),
      infiniteScroll: preference("postListInfiniteScroll", false),
      layout: preference<Layout>("postListLayout", "column"),
      postActionBar: preference<ActionBarMode>("postListPostActionBar", onDesktopDevice ? "hover" : "always"),
      postActionBarButtons: preference("postListPostActionBarButtons", ActionBarButton.Favorite),
      rowHeight: preference("postListRowHeight", 7),
      settingsCollapsed: preference("postListSettingsCollapsed", false),
      tooltipEnabled: preference("postListTooltipEnabled", false),
      upscaleQuality: preference("postListUpscaleQuality", 1),
      upscaleThumbs: preference("postListUpscaleThumbs", onDesktopDevice)
    }
  };
}
