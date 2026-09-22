import { ActionBarButton, ActionBarMode } from "@/lib/ui/thumb/action_bar";
import { Layout, PerformanceProfile, PostOverlayMode } from "@/types/app";
import { Rating, SortKey } from "@/types/search";
import { Environment } from "@/app/context/environment";
import { FavoritesDrawerView } from "@/types/favorite";
import { Preference } from "@/lib/storage/preference";
import { Theme } from "@/lib/ui/theme/themes";

export type Preferences = ReturnType<typeof buildPreferences>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export function buildPreferences(environment: Environment) {
  const { onDesktopDevice, onMobileDevice, usingDarkMode } = environment;
  return {
    app: {
      darkMode: new Preference<boolean>("appDarkMode", usingDarkMode),
      fadeThumbs: new Preference<boolean>("appFadeThumbs", true),
      gradient: new Preference("appGradient", false),
      nativeFont: new Preference<boolean>("appNativeFont", true),
      performanceProfile: new Preference<PerformanceProfile>("appPerformanceProfile", "normal"),
      theme: new Preference<Theme>("appTheme", "native")
    },

    favorites: {
      allowedRatings: new Preference<Rating>("favoritesAllowedRatings", 7),
      columnCount: new Preference("favoritesColumnCount", onDesktopDevice ? 5 : 2),
      downloadBatchSize: new Preference("favoritesDownloadBatchSize", 500),
      downloadFilenameFormat: new Preference("favoritesDownloadFilenameFormat", 3),
      drawerActiveView: new Preference<FavoritesDrawerView>("favoritesDrawerActiveView", "settings"),
      drawerOpen: new Preference("favoritesDrawerOpen", false),
      excludeBlacklist: new Preference("favoritesExcludeBlacklist", false),
      headerEnabled: new Preference("favoritesHeaderEnabled", true),
      hintsEnabled: new Preference("favoritesHintsEnabled", onDesktopDevice),
      infiniteScroll: new Preference("favoritesInfiniteScroll", onMobileDevice),
      layout: new Preference<Layout>("favoritesLayout", "column"),
      postActionBar: new Preference<ActionBarMode>("favoritesPostActionBar", onDesktopDevice ? "hover" : "off"),
      postActionBarButtons: new Preference("favoritesPostActionBarButtons", onDesktopDevice ? ActionBarButton.Favorite : ActionBarButton.Favorite | ActionBarButton.Open),
      resultsPerPage: new Preference("favoritesResultsPerPage", 100),
      rowHeight: new Preference("favoritesRowHeight", 7),
      settingsExpandedSections: new Preference<Record<string, boolean>>("favoritesSettingsExpandedSections", {}),
      sortAscending: new Preference("favoritesSortAscending", false),
      sortKey: new Preference<SortKey>("favoritesSortKey", "default"),
      tooltipEnabled: new Preference("favoritesTooltipEnabled", false),
      upscaleQuality: new Preference("favoritesUpscaleQuality", 1),
      upscaleThumbs: new Preference("favoritesUpscaleThumbs", true)
    },

    gallery: {
      autoplayActive: new Preference("galleryAutoplayActive", false),
      autoplayForward: new Preference("galleryAutoplayForward", true),
      autoplayImageDuration: new Preference("galleryAutoplayImageDuration", 3_000),
      autoplayMinimumVideoDuration: new Preference("galleryAutoplayMinimumVideoDuration", 5_000),
      autoplayPaused: new Preference("galleryAutoplayPaused", false),
      backgroundOpacity: new Preference("galleryBackgroundOpacity", 1),
      menuDockedLeft: new Preference("galleryMenuDockedLeft", onDesktopDevice),
      menuEnabled: new Preference("galleryMenuEnabled", onMobileDevice),
      menuPinned: new Preference("galleryMenuPinned", onMobileDevice),
      mobileEnabled: new Preference("galleryMobileEnabled", true),
      previewEnabled: new Preference("galleryPreviewEnabled", false),
      themedBackground: new Preference("galleryThemedBackground", false),
      tutorialSeen: new Preference("galleryTutorialSeen", false),
      videoMuted: new Preference("galleryVideoMuted", false),
      videoVolume: new Preference("galleryVideoVolume", 1)
    },

    postOverlay: {
      enabled: new Preference("postOverlayEnabled", false),
      mode: new Preference<PostOverlayMode>("postOverlayMode", "tag")
    },

    postList: {
      columnCount: new Preference("postListColumnCount", onDesktopDevice ? 5 : 2),
      enabled: new Preference("postListEnabled", false),
      favoriteIndicator: new Preference("postListFavoriteIndicator", false),
      infiniteScroll: new Preference("postListInfiniteScroll", false),
      layout: new Preference<Layout>("postListLayout", "column"),
      postActionBar: new Preference<ActionBarMode>("postListPostActionBar", onDesktopDevice ? "hover" : "always"),
      postActionBarButtons: new Preference("postListPostActionBarButtons", ActionBarButton.Favorite),
      rowHeight: new Preference("postListRowHeight", 7),
      settingsCollapsed: new Preference("postListSettingsCollapsed", false),
      tooltipEnabled: new Preference("postListTooltipEnabled", false),
      upscaleQuality: new Preference("postListUpscaleQuality", 1),
      upscaleThumbs: new Preference("postListUpscaleThumbs", onDesktopDevice)
    }
  };
}
